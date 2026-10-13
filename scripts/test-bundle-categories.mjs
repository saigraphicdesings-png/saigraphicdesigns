import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {categoryAPI} from '../src/bundle-categories.js';
function database(){const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE products(id TEXT PRIMARY KEY, category TEXT, updated_at TEXT)');return {sql,prepare(query){const statement=sql.prepare(query);let args=[];return {bind(...values){args=values;return this},async run(){const r=statement.run(...args);return {meta:{changes:Number(r.changes)}}},async all(){return {results:statement.all(...args)}},async first(){return statement.get(...args)||null}}},async batch(statements){sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}}}
const request=(method='GET',body)=>new Request('https://example.test/api/admin/bundle-categories',{method,...(body?{body:JSON.stringify(body)}:{})});
test('categories persist, reject duplicates, rename products and do not reappear',async()=>{
 const DB=database(),env={DB};let response=await categoryAPI(request(),env);assert.equal(response.status,200);
 assert.equal((await categoryAPI(request('POST',{name:'Wedding Bundles'}),env)).status,200);
 assert.equal((await categoryAPI(request('POST',{name:' wedding bundles '}),env)).status,409);
 DB.sql.prepare('INSERT INTO products VALUES (?,?,NULL)').run('bundle1','Business Card Bundles');
 assert.equal((await categoryAPI(request('DELETE',{name:'Business Card Bundles'}),env)).status,409);
 assert.equal((await categoryAPI(request('POST',{originalName:'Business Card Bundles',name:'Custom Card Bundles'}),env)).status,200);
 assert.equal(DB.sql.prepare('SELECT category FROM products').get().category,'Custom Card Bundles');
 let data=await (await categoryAPI(request(),env)).json();assert(!data.categories.some(c=>c.name==='Business Card Bundles'));assert.equal(data.categories.find(c=>c.name==='Custom Card Bundles').productCount,1);
 assert.equal((await categoryAPI(request('POST',{originalName:'Custom Card Bundles',name:'Wedding Bundles'}),env)).status,409);
 assert.equal(DB.sql.prepare('SELECT category FROM products').get().category,'Custom Card Bundles');
 assert.equal((await categoryAPI(request('DELETE',{name:'Wedding Bundles'}),env)).status,200);
 data=await (await categoryAPI(request(),env)).json();assert(!data.categories.some(c=>c.name==='Wedding Bundles'));
 assert.equal((await categoryAPI(request('POST',{name:'Wedding Bundles'}),env)).status,200);
 assert.equal((await categoryAPI(request('POST',{name:''}),env)).status,400);
 assert.equal((await categoryAPI(request('POST',{name:'x'.repeat(81)}),env)).status,400);
 DB.sql.close();
});
