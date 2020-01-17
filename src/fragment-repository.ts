import {MongoClient} from 'mongodb'
import {GuideWords} from './guide-words'

function lemmaAndHomonymMatch(guideWord: GuideWords) {
  return {
    lemma: [guideWord.lemma],
    homonym: guideWord.eblHomonym,
  }
}

function setGuideWord(guideWord: GuideWords) {
  return {
    guideWord: guideWord.eblGuideWord,
  }
}

function pushOraccWord(guideWord: GuideWords) {
  return {
    oraccWords: {
      lemma: guideWord.oraccLemma,
      guideWord: guideWord.oraccGuideWord,
    },
  }
}

function createBulkOperations(guideWords: readonly GuideWords[]) {
  return guideWords.map(guideWord => ({
    updateOne: {
      filter: lemmaAndHomonymMatch(guideWord),
      update: {
        $set: setGuideWord(guideWord),
        $push: pushOraccWord(guideWord),
      },
    },
  }))
}

export async function updateFragments(uri: string, guideWords: readonly GuideWords[]) {
  const client = new MongoClient(uri, {useNewUrlParser: true})
  try {
    await client.connect()
    const collection = client.db('ebl').collection('fragments')
    await collection.bulkWrite(createBulkOperations(guideWords))
  } finally {
    await client.close()
  }
}
