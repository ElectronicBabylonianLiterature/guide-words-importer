import {Command, flags} from '@oclif/command'
import cli from 'cli-ux'
import * as _ from 'lodash'
import {setGuideWords} from './fragment-repository'
import {parseFromFile, unparse} from './guide-word-parser'
import {GuideWords, isValidIn} from './guide-words'

class GuideWordsImporter extends Command {
  static description = 'Imports guide words from a CSV file to MongoDB.'

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    host: flags.string({char: 'h', description: 'MongoDB URI', default: 'mongodb://localhost:27017'}),
    db: flags.string({char: 'd', description: 'database name', default: 'ebl'}),
    ssl: flags.boolean({description: 'Use SSL connection.'}),
  }

  static args = [{name: 'file', description: 'Path to the CSV file', required: true}]

  async run() {
    const {args: {file}, flags: {host, db, ssl}} = this.parse(GuideWordsImporter)

    try {
      cli.action.start(`Loading guide words from ${file}...`)
      const [guideWords, rejectedGuideWords] = await this.loadGuideWords(file)
      cli.action.stop()

      cli.action.start(`Updating guide words to MongoDB ${host}...`)
      await setGuideWords(host, db, ssl, guideWords)
      cli.action.stop()

      this.log(unparse(rejectedGuideWords))
    } catch (error) {
      this.error(error)
    }
  }

  private async loadGuideWords(file: string): Promise<[GuideWords[], GuideWords[]]> {
    return parseFromFile(file).then(guideWords => _.partition(guideWords, isValidIn(guideWords)))
  }
}

export = GuideWordsImporter
