import {MongoClient} from 'mongodb'
import {GuideWords} from './guide-words'

function createBulkOperations(guideWords: readonly GuideWords[]) {
  return guideWords.map(guideWord => ({
    updateOne: {
      filter: {
        lemma: [guideWord.lemma],
        homonym: guideWord.eblHomonym,
      },
      update: {
        $set: {
          guideWord: guideWord.eblGuideWord,
          oraccWords: [
            {
              lemma: guideWord.oraccLemma,
              guideWord: guideWord.oraccGuideWord,
            },
          ],
        },
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
