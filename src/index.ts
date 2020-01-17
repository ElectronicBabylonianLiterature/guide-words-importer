import {Command, flags} from '@oclif/command'
import {updateFragments} from './fragment-repository'
import {parseFromFile} from './guide-word-parser'

class GuideWordsImporter extends Command {
  static description = 'Imports guide words from a CSV file to MongoDB.'

  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    host: flags.string({char: 'h', description: 'MongoDB URI', default: 'mongodb://localhost:27017'}),
  }

  static args = [{name: 'file', description: 'Path to the CSV file', required: true}]

  async run() {
    const {args: {file}, flags: {host}} = this.parse(GuideWordsImporter)

    try {
      this.log(`Loading guide words from ${file}...`)
      const guideWords = await parseFromFile(file)

      this.log(`Updating guide words to MongoDB ${host}...`)
      await updateFragments(host, guideWords)
    } catch (error) {
      this.error(error)
    }
  }
}

export = GuideWordsImporter
