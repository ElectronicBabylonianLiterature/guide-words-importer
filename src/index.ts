import * as fs from 'fs'
import {Command, flags} from '@oclif/command'
import {MongoClient} from 'mongodb'
import * as Papa from 'papaparse'

interface GuideWords {
  lemma: string;
  eblHomonym: string;
  eblGuideWord: string;
  oraccLemma: string;
  oraccGuideWord: string;
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
    const {args: {file}, flags} = this.parse(GuideWordsImporter)

    const uri = flags.host || 'mongodb://localhost:27017'

    const guideWords = await this.loadGuideWords(file)
    await this.updateFragments(uri, guideWords)
  }

  private async loadGuideWords(file: string): Promise<readonly GuideWords[]> {
    this.log(`Loading guide words from ${file}...`)
    const csv = await new Promise<string>((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) =>
        err ? reject(err) : resolve(data))
    })
    return Papa.parse(csv, {
      header: true,
    }).data
  }

  private async updateFragments(uri: string, guideWords: readonly GuideWords[]) {
    this.log(`Connecting to MongoDB ${uri}...`)
    const client = new MongoClient(uri, {useNewUrlParser: true})

    const operations = guideWords.map(guideWord => ({
      updateOne: {
        filter: {
          lemma: [guideWord.lemma],
          homonym: guideWord.eblHomonym,
        },
        update: {$set: {
          guideWord: guideWord.eblGuideWord,
          oraccWords: [
            {
              lemma: guideWord.oraccLemma,
              guideWord: guideWord.oraccGuideWord,
            },
          ],
        }},
      },
    }))

    try {
      await client.connect()
      const collection = client.db('ebl').collection('fragments')
      await collection.bulkWrite(operations)
      await client.close()
    } catch (error) {
      this.error(error)
    } finally {
      await client.close()
    }
  }
}

export = GuideWordsImporter
