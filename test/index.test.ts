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
  .stderr()
  .timeout(60000)
  .do(() => cmd.run(['./test/guide-words.csv']))
  .exit(2)
  .it('default database', ctx => {
    expect(ctx.stderr).to.contain('mongodb://localhost:27017')
  })

  test
  .add('db', () => 'ebltest')
  .add('mongod', () => new MongoMemoryServer())
  .finally(async ctx => ctx.mongod.stop())
  .add('uri', async ctx => ctx.mongod.getUri())
  .add('client', async ctx => new MongoClient(ctx.uri, {useNewUrlParser: true, useUnifiedTopology: true}))
  .do(async ctx => ctx.client.connect())
  .finally(async ctx => ctx.client.close())
  .add('collection', ctx => ctx.client.db(ctx.db).collection('words'))
  .do(async ctx => ctx.collection.insertOne({_id: 'X.1', homonym: 'I', lemma: ['ebl', 'lemma1']}))
  .do(async ctx => ctx.collection.insertOne({_id: 'X.2', homonym: 'I', lemma: ['ebllemma2']}))
  .do(async ctx => ctx.collection.insertOne({_id: 'X.3', homonym: 'II', lemma: ['ebllemma2']}))
  .stdout()
  .stderr()
  .do(ctx => cmd.run(['--host', ctx.uri, '--db', ctx.db, './test/guide-words.csv']))
  .it('imports guide words', async ctx => {
    expect(ctx.stderr).to.contain(ctx.uri)
    expect(ctx.stdout).to.contain('ebllemma2,II,ebl gw3,,')
    expect(ctx.stdout).to.contain('ebllemma2,II,ebl gw4,,')
    expect(ctx.stdout).to.contain(',,,oracc lemma,oracc gw4')
    const fragments = await ctx.collection.find().toArray()
    expect(fragments).to.deep.equal([
      {
        _id: 'X.1',
        lemma: ['ebl', 'lemma1'],
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
      {
        _id: 'X.3',
        lemma: ['ebllemma2'],
        homonym: 'II',
        oraccWords: [],
      },
    ])
  })
})
