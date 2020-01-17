import {MongoClient} from 'mongodb'
import {GuideWords} from './guide-words'

function lemmaAndHomonymMatch(guideWord: GuideWords) {
  return {
    lemma: guideWord.lemma.split(' '),
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
      lemma: guideWord.oraccLemma || guideWord.lemma,
      guideWord: guideWord.oraccGuideWord,
    },
  }
}

function updateGuideWords(guideWord: GuideWords) {
  const hasOraccWord = guideWord.oraccLemma || guideWord.oraccGuideWord
  return hasOraccWord ?
    {$set: setGuideWord(guideWord), $push: pushOraccWord(guideWord)} :
    {$set: setGuideWord(guideWord)}
}

function oraccWordDoesNotExist() {
  return {oraccWords: {$exists: false}}
}

function setDeafultOraccWords() {
  return {$set: {oraccWords: []}}
}

function createBulkOperations(guideWords: readonly GuideWords[]) {
  return guideWords.map<object>(guideWord => ({
    updateOne: {
      filter: lemmaAndHomonymMatch(guideWord),
      update: updateGuideWords(guideWord),
    },
  })).concat({
    updateMany: {
      filter: oraccWordDoesNotExist(),
      update: setDeafultOraccWords(),
    },
  })
}

export async function setGuideWords(uri: string, guideWords: readonly GuideWords[]) {
  const client = new MongoClient(uri, {useNewUrlParser: true})
  try {
    await client.connect()
    const collection = client.db('ebl').collection('fragments')
    await collection.bulkWrite(createBulkOperations(guideWords))
  } finally {
    await client.close()
  }
}
