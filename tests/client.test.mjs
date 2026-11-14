import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SkyvoraClient, SkyvoraError } from '../src/client.mjs'
import { formatMarkdown } from '../src/format.mjs'

const response = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body })
test('search validates inputs, sends bearer and idempotency headers, preserves public result', async () => {
  let call
  const client = new SkyvoraClient({ apiKey: 'secret-test', fetchImpl: async (...args) => { call = args; return response(200, { status: 'succeeded', organic: [{ title: 'A', link: 'https://example.test' }] }) } })
  const result = await client.search({ q: 'test' })
  assert.equal(call[0], 'https://serp.skyvora.cc/api/v1/search')
  assert.equal(call[1].headers.Authorization, 'Bearer secret-test')
  assert.equal(call[1].headers['Idempotency-Key'], result.idempotency_key)
  assert.equal(JSON.parse(call[1].body).q, 'test')
  assert.equal(result.organic[0].title, 'A')
  assert.equal(typeof result.client_duration_ms, 'number')
  await assert.rejects(client.search({ q: 'x', arbitrary: true }), /unsupported search parameter/)
})

test('pending 202 receipt returns public settlement fields and recovery key', async () => {
  const client = new SkyvoraClient({ apiKey: 's', fetchImpl: async () => response(202, { status: 'running', request_id: 'req-1', settlement_pending: true, charged: 0, server_duration_ms: 30000, private: 'omit' }) })
  const data = await client.search({ q: 'hello', idempotency_key: 'recover-123' })
  assert.equal(data.status, 'running'); assert.equal(data.request_id, 'req-1'); assert.equal(data.settlement_pending, true); assert.equal(data.charged, 0); assert.equal(data.idempotency_key, 'recover-123'); assert.equal(data.private, undefined)
})

test('504 request_pending and 202 error receipt return recoverable public fields', async () => {
  for (const status of [202, 504]) {
    const client = new SkyvoraClient({ apiKey: 's', fetchImpl: async () => response(status, { status: 'queued', request_id: 'req-2', settlement_pending: true, charged: 0, error: { code: 'request_pending', message: 'private diagnostic' } }) })
    const data = await client.search({ q: 'hello', idempotency_key: 'recover-456' })
    assert.equal(data.status, 'queued'); assert.equal(data.settlement_pending, true); assert.equal(data.idempotency_key, 'recover-456'); assert.equal(data.error, undefined)
  }
})

test('terminal 504 remains an error and server error content is never surfaced', async () => {
  const client = new SkyvoraClient({ apiKey: 's', fetchImpl: async () => response(504, { status:'failed', request_id:'req-3', charged:0, settlement_pending:false, error:{ code:'upstream_timeout', message:'secret details' } }) })
  await assert.rejects(client.search({ q:'x', idempotency_key:'key-terminal' }), e => { const out=e.toJSON(); assert.equal(e.code,'upstream_timeout'); assert.equal(e.requestId,'req-3'); assert.equal(out.http_status,504); assert.equal(out.request_status,'failed'); assert.equal(out.charged,0); assert.equal(out.settlement_pending,false); assert.equal(out.idempotency_key,'key-terminal'); assert.doesNotMatch(JSON.stringify(out),/secret details/); return true })
})

test('transport uncertainty has same idempotency key and no retries', async () => {
  let calls = 0
  const client = new SkyvoraClient({ apiKey: 's', fetchImpl: async () => { calls++; throw new Error('secret socket detail') } })
  await assert.rejects(client.search({ q: 'hello', idempotency_key: 'recover-123' }), e => { assert.equal(e.code, 'transport_unknown'); assert.equal(e.idempotencyKey, 'recover-123'); assert.equal(e.toJSON().outcome_unknown, true); assert.match(e.toJSON().recovery_guidance, /same idempotency key/); assert.doesNotMatch(JSON.stringify(e), /secret socket/); return true })
  assert.equal(calls, 1)
})

test('batch is bounded, ordered, partial, and each failed item retains recovery identity', async () => {
  let active = 0; let max = 0
  const client = new SkyvoraClient({ apiKey: 's', fetchImpl: async (_url, init) => { active++; max = Math.max(max, active); const p = JSON.parse(init.body); await new Promise(r => setTimeout(r, p.q === 'slow' ? 15 : 2)); active--; return p.q === 'bad' ? response(400, { error: { code: 'invalid_request', message: 'private' } }) : p.q === 'pending' ? response(202,{ status:'running', request_id:'p1', settlement_pending:true }) : response(200, { q: p.q, status: 'succeeded', organic: [] }) } })
  const result = await client.batchSearch([{ q:'slow' }, { q:'bad', idempotency_key:'recover-bad' }, { q:'pending' }, { q:'fast' }], { concurrency: 2 })
  assert.equal(max, 2); assert.deepEqual(result.results.map(x => x.index), [0,1,2,3]); assert.deepEqual(result.results.map(x => x.ok), [true,false,true,true]); assert.equal(result.results[1].error.idempotency_key, 'recover-bad'); assert.equal(result.summary.failed, 1); assert.equal(result.summary.pending, 1); assert.equal(result.summary.succeeded, 2); assert.equal(result.summary.unknown, 0)
})

test('base URL and identifiers are constrained', async () => {
  assert.throws(() => new SkyvoraClient({ apiKey:'s', baseUrl:'http://example.com' }), /HTTPS/)
  assert.throws(() => new SkyvoraClient({ apiKey:'s', baseUrl:'https://user:pass@example.com' }), /credentials/)
  const c = new SkyvoraClient({ apiKey:'s', baseUrl:'http://localhost:9999' })
  await assert.rejects(c.getRequest('../x'), /invalid/)
})

test('invalid success responses are unknown and include identity', async () => {
  for (const json of [async () => { throw new SyntaxError('secret') }, async () => 'not-object', async () => ({}), async () => ({status:'succeeded',organic:{}})]) {
    const client = new SkyvoraClient({ apiKey:'s', fetchImpl: async () => ({ status:200, ok:true, json }) })
    await assert.rejects(client.search({ q:'x', idempotency_key:'invalid-123' }), e => { assert.equal(e.code,'response_invalid'); assert.equal(e.idempotencyKey,'invalid-123'); assert.equal(e.toJSON().outcome_unknown,true); return true })
  }
})

test('HTTP 200 terminal failed response remains a failure with safe settlement snapshot', async () => {
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>response(200,{status:'failed',request_id:'failed-1',charged:0,settlement_pending:false,private:'omit'})})
  await assert.rejects(client.search({q:'x',idempotency_key:'failed-key-123'}),e=>{const out=e.toJSON();assert.equal(e.code,'request_failed');assert.equal(out.request_status,'failed');assert.equal(out.charged,0);assert.equal(out.settlement_pending,false);assert.equal(out.idempotency_key,'failed-key-123');assert.equal(out.private,undefined);return true})
})

test('GET accepts known request states, filters public fields, and retains request ID on transport errors', async () => {
  const client = new SkyvoraClient({ apiKey:'s', fetchImpl: async () => response(200,{status:'succeeded',request_id:'req-42',organic:[],charged:1,private:'hide'}) })
  const data=await client.getRequest('req-42'); assert.equal(data.status,'succeeded'); assert.equal(data.request_id,'req-42'); assert.equal(data.private,undefined)
  const failed=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{throw Error('secret')}})
  await assert.rejects(failed.getRequest('req-43'),e=>{assert.equal(e.requestId,'req-43');assert.equal(e.toJSON().request_id,'req-43');assert.match(e.toJSON().recovery_guidance,/same request ID/);return true})
})

test('query length counts Unicode code points at the 200 character boundary', async () => {
  let calls=0
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{calls++;return response(200,{status:'succeeded',organic:[]})}})
  await client.search({q:'😀'.repeat(200)})
  await assert.rejects(client.search({q:'😀'.repeat(201)}),TypeError)
  assert.equal(calls,1)
})

test('Google and Bing pagination follow engine-specific cursor strings and bounds', async () => {
  const bodies=[]
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async(_url,init)=>{bodies.push(JSON.parse(init.body));return response(200,{status:'succeeded',organic:[]})}})
  await client.search({q:'google page',start:10,cursor:10})
  await client.search({q:'bing page',engine:'bing',region:'GB',start:10,cursor:'11',mkt:'en-GB',cc:'GB',gl:'GB',hl:'en'})
  assert.equal(bodies[0].cursor,'10'); assert.equal(typeof bodies[0].cursor,'string')
  assert.equal(bodies[1].cursor,'11'); assert.equal(typeof bodies[1].cursor,'string')
})

test('handler-invalid query and selector combinations do not call fetch', async () => {
  let calls=0
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{calls++;return response(200,{status:'succeeded',organic:[]})}})
  const invalid=[
    {q:'  \n '}, {q:'x\r'}, {q:'x\0'}, {q:'x',engine:'google',mkt:'en-US'},
    {q:'x',engine:'google',cc:'US'}, {q:'x',engine:'google',start:10001},
    {q:'x',engine:'google',cursor:'01'}, {q:'x',engine:'google',cursor:'10001'},
    {q:'x',engine:'google',start:2,cursor:'3'}, {q:'x',engine:'bing',cursor:0},
    {q:'x',engine:'bing',start:2,cursor:'2'}, {q:'x',engine:'bing',start:10001},
    {q:'x',engine:'bing',region:'GB',cc:'US'}, {q:'x',engine:'bing',region:'GB',gl:'GB',mkt:'english-GB'},
    {q:'x',engine:'bing',region:'GB',mkt:'en-GB',hl:'zh-CN'}, {q:'x',engine:'bing',region:'GB',mkt:'en-GB',hl:'e'},
    {q:'x',hl:'a'.repeat(17)}, {q:'x'.repeat(201)}, {q:'x',idempotency_key:'é'.repeat(65)}
  ]
  for(const params of invalid) await assert.rejects(client.search(params),TypeError,JSON.stringify(params))
  assert.equal(calls,0)
})

test('redirects are rejected, 429 retry-after is bounded, and absent keys fail before requests', async () => {
  let opts
  const client = new SkyvoraClient({ apiKey:'s', fetchImpl: async (_url, options) => { opts=options; return { ...response(429,{ error:{code:'rate_limited;private'} }), headers:{ get: ()=>'99999' } } } })
  await assert.rejects(client.search({ q:'x', idempotency_key:'rate-limit-123' }), e => { assert.equal(e.code,'http_429'); assert.equal(e.retryAfterSeconds,3600); return true })
  assert.equal(opts.redirect,'error')
  let calls=0
  const noKey = new SkyvoraClient({ apiKey:'s', fetchImpl: async () => { calls++; throw new Error() } })
  for (const params of [{q:''},{q:'x',engine:'other'},{q:'x',region:'ZZZ'},{q:'x',wait_ms:30001},{q:'x',channel:'x'.repeat(65)}]) await assert.rejects(noKey.search(params), TypeError)
  assert.equal(calls,0)
  assert.throws(() => new SkyvoraClient({ apiKey:'' }), /API key/)
})

test('aborted batches do not dispatch queued items', async () => {
  const controller = new AbortController(); let calls=0
  const client = new SkyvoraClient({ apiKey:'s', fetchImpl: async (_url,{signal}) => { calls++; controller.abort(); if (signal.aborted) throw new Error('abort'); await new Promise(resolve => signal.addEventListener('abort', resolve,{once:true})); throw new Error('abort') } })
  const result = await client.batchSearch([{q:'1'},{q:'2'},{q:'3'}], {concurrency:1, signal:controller.signal})
  assert.equal(calls,1); assert.equal(result.results[1].error.code,'batch_aborted'); assert.equal(result.results[2].error.code,'batch_aborted')
})

test('API key file is a private fallback with explicit key and env key precedence', async () => {
  const names=['EASYSERP_API_KEY','SKYVORA_API_KEY','SERP_API_TOKEN','EASYSERP_API_KEY_FILE']
  const before=Object.fromEntries(names.map(name=>[name,process.env[name]]))
  const dir=await mkdtemp(join(tmpdir(),'easyserp-key-')); const file=join(dir,'private-token')
  try {
    await writeFile(file,'  file-secret-token\n',{mode:0o600}); await chmod(file,0o600)
    process.env.EASYSERP_API_KEY=''; process.env.SKYVORA_API_KEY=''; process.env.SERP_API_TOKEN=''; process.env.EASYSERP_API_KEY_FILE=file
    assert.equal(new SkyvoraClient().apiKey,'file-secret-token')
    assert.equal(new SkyvoraClient({apiKeyFile:file}).apiKey,'file-secret-token')
    process.env.EASYSERP_API_KEY='environment-token'
    assert.equal(new SkyvoraClient({apiKey:'explicit-token'}).apiKey,'explicit-token')
    assert.equal(new SkyvoraClient().apiKey,'environment-token')
    process.env.EASYSERP_API_KEY=''
    await assert.rejects(Promise.resolve().then(()=>new SkyvoraClient({apiKeyFile:join(dir,'missing-secret-path')})),e=>{assert.match(e.message,/API key file/);assert.doesNotMatch(e.message,/missing-secret-path/);return true})
    await writeFile(file,'bad\nkey',{mode:0o600})
    process.env.EASYSERP_API_KEY=''
    assert.throws(()=>new SkyvoraClient({apiKeyFile:file}),e=>{assert.match(e.message,/API key/);assert.doesNotMatch(e.message,/bad/);return true})
  } finally {
    for(const name of names) { if(before[name]===undefined) delete process.env[name]; else process.env[name]=before[name] }
    await rm(dir,{recursive:true,force:true})
  }
})

test('searchRelevant retries unknown outcomes with the same key and returns attempt recovery history', async () => {
  const keys=[]; let n=0
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async(_url,init)=>{keys.push(init.headers['Idempotency-Key']);if(n++===0)throw Error('socket');return response(200,{status:'succeeded',charged:1,organic:[{title:'Search notes',link:'https://example.test/a?utm_source=x'}]})}})
  const result=await client.searchRelevant({q:'search notes',idempotency_key:'same-key-123'},{retries:1})
  assert.deepEqual(keys,['same-key-123','same-key-123'])
  assert.equal(result.attempt_history.length,2);assert.deepEqual(result.recovery_keys,['same-key-123','same-key-123']);assert.equal(result.charged_total,1)
})

test('searchRelevant rotates key only after confirmed zero-charge terminal settlement', async () => {
  const keys=[];let calls=0
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async(_url,init)=>{keys.push(init.headers['Idempotency-Key']);calls++;return calls===1?response(200,{status:'failed',request_id:'f1',charged:0,settlement_pending:false}):response(200,{status:'succeeded',charged:1,organic:[]})}})
  const result=await client.searchRelevant({q:'retry',idempotency_key:'first-key-123'},{retries:1})
  assert.equal(calls,2);assert.equal(keys[0],'first-key-123');assert.notEqual(keys[1],keys[0]);assert.deepEqual(result.recovery_keys,keys);assert.equal(result.charged_total,1)
})

test('searchRelevant returns pending receipts without resubmission and does not retry auth failures', async () => {
  let calls=0
  const pending=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{calls++;return response(202,{status:'running',request_id:'p',settlement_pending:true,charged:0})}})
  const receipt=await pending.searchRelevant({q:'pending'},{retries:2});assert.equal(calls,1);assert.equal(receipt.status,'running')
  const denied=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{calls++;return response(401,{error:{code:'unauthorized'}})}})
  await assert.rejects(denied.searchRelevant({q:'denied'}),e=>{assert.equal(e.code,'unauthorized');return true});assert.equal(calls,2)
})

test('searchRelevant filters scoped domains, removes tracking-only duplicates, and warns on empty scope', async () => {
  const rows=[
    {title:'unrelated',link:'https://sub.example.com/a?utm_source=one',snippet:'x'},
    {title:'query match',link:'https://sub.example.com/a?utm_medium=two',snippet:'alpha beta'},
    {title:'outside',link:'https://outside.test/a',snippet:'alpha beta'}
  ]
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>response(200,{status:'succeeded',organic:rows})})
  const data=await client.searchRelevant({q:'alpha beta'},{includeDomains:['example.com'],retries:0})
  assert.equal(data.original_organic.length,3);assert.equal(data.organic.length,1);assert.equal(data.organic[0].title,'query match');assert.ok(data.quality.warnings.includes('results_filtered_or_deduplicated'))
  const emptyClient=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>response(200,{status:'succeeded',organic:rows})})
  const empty=await emptyClient.searchRelevant({q:'site:missing.test alpha'},{retries:0})
  assert.equal(empty.organic.length,0);assert.ok(empty.quality.warnings.includes('source_scope_not_satisfied'))
})

test('a successful default search is charged once and never retried', async () => {
  let calls=0
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{calls++;return response(200,{status:'succeeded',charged:1,organic:[]})}})
  const result=await client.searchRelevant({q:'ordinary search'})
  assert.equal(calls,1);assert.equal(result.charged_total,1);assert.equal(result.charged_total_known,true);assert.equal(result.attempt_history.length,1)
})

test('charge aggregation counts an idempotent retry once and keeps unknown charge state explicit', async () => {
  let n=0
  const sameKey=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{if(n++===0)throw Error('disconnect');return response(200,{status:'succeeded',charged:1,organic:[]})}})
  const result=await sameKey.searchRelevant({q:'retry charge',idempotency_key:'samecharge-123'},{retries:1})
  assert.equal(result.charged_total,1);assert.equal(result.charged_total_known,true)
  const unknown=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{throw Error('disconnect')}})
  await assert.rejects(unknown.searchRelevant({q:'unknown charge',idempotency_key:'unknowncharge-1'},{retries:0}),e=>{const out=e.toJSON();assert.equal(out.charged_total,undefined);assert.equal(out.charged_total_known,false);assert.equal(out.attempt_history.length,1);assert.deepEqual(out.recovery_keys,['unknowncharge-1']);return true})
})

test('site scopes constrain include domains and exclude negative site domains; unsafe result URLs are dropped', async () => {
  const rows=[{title:'match',link:'https://sub.good.test/a'},{title:'excluded',link:'https://bad.test/a'},{title:'unsafe',link:'javascript:alert(1)'},{title:'credential',link:'https://user:pass@good.test/a'}]
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>response(200,{status:'succeeded',organic:rows})})
  const data=await client.searchRelevant({q:'site:good.test -site:bad.test'},{includeDomains:['good.test'],retries:0})
  assert.deepEqual(data.organic.map(row=>row.title),['match']);assert.deepEqual(data.original_organic,rows)
  const constrained=await client.searchRelevant({q:'site:good.test'},{includeDomains:['other.test'],retries:0})
  assert.equal(constrained.organic.length,0);assert.ok(constrained.quality.warnings.includes('source_scope_not_satisfied'))
})

test('429 retry-after longer than deadline is returned without an early retry', async () => {
  let calls=0
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{calls++;return { ...response(429,{error:{code:'rate_limited'}}),headers:{get:()=> '60'} } }})
  await assert.rejects(client.searchRelevant({q:'limited',idempotency_key:'limited-key-123'},{retries:2,deadlineMs:20}),e=>{assert.equal(e.code,'rate_limited');assert.equal(e.toJSON().retry_after_seconds,60);assert.equal(e.toJSON().attempt_history.length,1);return true})
  assert.equal(calls,1)
})

test('confirmed failed zero-charge receipt may rotate key when settlement flag is absent', async () => {
  const keys=[];let posts=0;let gets=0
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async(url,init)=>{
    if(url.endsWith('/api/v1/search')) { posts++;keys.push(init.headers['Idempotency-Key']);return posts===1?response(200,{status:'failed',request_id:'failed-receipt',charged:0}):response(200,{status:'succeeded',charged:1,organic:[]}) }
    gets++;return response(200,{status:'failed',request_id:'failed-receipt',charged:0})
  }})
  const result=await client.searchRelevant({q:'failed receipt',idempotency_key:'failed-without-flag'},{retries:1})
  assert.equal(gets,1);assert.equal(posts,2);assert.notEqual(keys[0],keys[1]);assert.equal(result.charged_total,1)
})

test('GET-recovered success includes its charge and stays inside the search deadline', async () => {
  const calls=[]
  const client=new SkyvoraClient({apiKey:'s',timeoutMs:5000,fetchImpl:async(url,init)=>{
    calls.push({url,timeoutSignal:init.signal})
    return url.endsWith('/api/v1/search')
      ? response(504,{status:'failed',request_id:'recover-ok',error:{code:'upstream_timeout'}})
      : response(200,{status:'succeeded',request_id:'recover-ok',charged:1,organic:[{title:'Recovered',link:'https://example.test'}]})
  }})
  const result=await client.searchRelevant({q:'recovered success',idempotency_key:'recover-ok-key'},{retries:1,deadlineMs:1000})
  assert.equal(calls.length,2);assert.equal(result.charged_total,1);assert.equal(result.attempt_history.at(-1).q,'recovered success');assert.equal(result.attempt_history.at(-1).request_id,'recover-ok');assert.equal(result.organic[0].title,'Recovered')
})

test('relevant batch uses bounded worker count and retains per-item scope warnings', async () => {
  let calls=0;let active=0;let max=0
  const client=new SkyvoraClient({apiKey:'s',fetchImpl:async()=>{calls++;active++;max=Math.max(max,active);await new Promise(resolve=>setTimeout(resolve,3));active--;return response(200,{status:'succeeded',charged:1,organic:[{title:'Other',link:'https://other.test'}]})}})
  const result=await client.batchSearch([{q:'one'},{q:'two'},{q:'three'}],{concurrency:2,relevant:true,includeDomains:['wanted.test'],retries:0})
  assert.equal(calls,3);assert.equal(max,2);assert.deepEqual(result.results.map(item=>item.data.organic.length),[0,0,0]);assert.ok(result.results.every(item=>item.data.quality.warnings.includes('source_scope_not_satisfied')))
})

test('markdown explains when requested source coverage has no matching results', () => {
  const markdown=formatMarkdown({search_parameters:{q:'site:requested.test topic'},organic:[],quality:{original:7,warnings:['source_scope_not_satisfied']}})
  assert.match(markdown,/Requested source coverage was not satisfied/);assert.match(markdown,/7 upstream result\(s\)/);assert.match(markdown,/No organic results/)
})
