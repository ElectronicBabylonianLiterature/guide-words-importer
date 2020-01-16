import {expect, test} from '@oclif/test'
import {MongoMemoryServer} from 'mongodb-memory-server'
import {MongoClient} from 'mongodb'

import cmd = require('../src')

describe('guide-words-importer', () => {
  test
  .stdout()
  .do(() => cmd.run([]))
  .exit(2)
  .it('runs importgws', ctx => {
    expect(ctx.stdout).to.contain('mongodb://localhost:27017')
  })

  test
  .add('mongod', () => new MongoMemoryServer())
  .finally(async ctx => ctx.mongod.stop())
  .add('uri', async ctx => ctx.mongod.getUri())
  .add('client', async ctx => new MongoClient(ctx.uri, {useNewUrlParser: true}))
  .do(async ctx => ctx.client.connect())
  .finally(async ctx => ctx.client.close())
  .add('collection', ctx => ctx.client.db('ebl').collection('fragments'))
  .do(async ctx => ctx.collection.insertOne({_id: 'K.1'}))
  .stdout()
  .do(ctx => cmd.run(['--host', ctx.uri]))
  .it('runs importgws --host ...', async ctx => {
    expect(ctx.stdout).to.contain(ctx.uri)
    const fragment = await ctx.collection.findOne({_id: 'K.1'})
    expect(fragment).to.deep.equal({_id: 'K.1', guideWord: '', oraccWords: []})
  })
})
