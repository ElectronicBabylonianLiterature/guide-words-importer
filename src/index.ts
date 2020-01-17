import * as fs from 'fs'
import {Command, flags} from '@oclif/command'
import {MongoClient} from 'mongodb'
import * as Papa from 'papaparse'

async function readFile(fileName: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => err ? reject(err) : resolve(data))
  })
}

interface GuideWords {
  lemma: string;
  eblHomonym: string;
  eblGuideWord: string;
  oraccLemma: string;
  oraccGuideWord: string;
}

function parseGuideWords(csv: string): readonly GuideWords[] | PromiseLike<readonly GuideWords[]> {
  return Papa.parse(csv, {
    header: true,
  }).data
}

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
class GuideWordsImporter extends Command {
  static description = 'describe the command here'

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    host: flags.string({char: 'h', description: 'MongoDB URI'}),
  }

  static args = [{name: 'file', required: true}]

  async run() {
    const {args: {file}, flags: {host = 'mongodb://localhost:27017'}} = this.parse(GuideWordsImporter)
    const guideWords = await this.loadGuideWords(file)
    await this.updateFragments(host, guideWords)
  }

  private async loadGuideWords(file: string): Promise<readonly GuideWords[]> {
    this.log(`Loading guide words from ${file}...`)
    const csv = await readFile(file)
    return parseGuideWords(csv)
  }

  private async updateFragments(uri: string, guideWords: readonly GuideWords[]) {
    const client = new MongoClient(uri, {useNewUrlParser: true})
    try {
      this.log(`Connecting to MongoDB ${uri}...`)
      await client.connect()
      const collection = client.db('ebl').collection('fragments')
      await collection.bulkWrite(createBulkOperations(guideWords))
    } catch (error) {
      this.error(error)
    } finally {
      await client.close()
    }
  }
}

export = GuideWordsImporter
