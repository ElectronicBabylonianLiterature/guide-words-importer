import {expect, test} from '@oclif/test'
import {MongoMemoryServer} from 'mongodb-memory-server'
import {MongoClient} from 'mongodb'

import cmd = require('../src')

describe('guide-words-importer', () => {
  test
  .do(() => cmd.run([]))
  .exit(2)
  .it('missing file argument')

  test
  .do(() => cmd.run(['not-found.csv']))
  .exit(2)
  .it('file not found')

  test
  .stdout()
  .do(() => cmd.run(['./test/guide-words.csv']))
  .exit(2)
  .it('default database', ctx => {
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
  .do(async ctx => ctx.collection.insertOne({_id: 'X.1', homonym: 'I', lemma: ['ebllemma1']}))
  .do(async ctx => ctx.collection.insertOne({_id: 'X.2', homonym: 'I', lemma: ['ebllemma2']}))
  .stdout()
  .do(ctx => cmd.run(['--host', ctx.uri, './test/guide-words.csv']))
  .it('imports guide words', async ctx => {
    expect(ctx.stdout).to.contain(ctx.uri)
    const fragments = await ctx.collection.find().toArray()
    expect(fragments).to.deep.equal([
      {
        _id: 'X.1',
        lemma: ['ebllemma1'],
        homonym: 'I',
        guideWord: 'ebl gw1',
        oraccWords: [],
      },
      {
        _id: 'X.2',
        lemma: ['ebllemma2'],
        homonym: 'I',
        guideWord: 'ebl gw2',
        oraccWords: [
          {lemma: 'oracclemma2', guideWord: 'oracc gw2'},
          {lemma: 'ebllemma2', guideWord: 'oracc gw3'},
        ],
      },
    ])
  })
})
