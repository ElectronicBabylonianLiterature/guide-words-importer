import {Command, flags} from '@oclif/command'
import {updateFragments} from './fragment-repository'
import {parseFromFile} from './guide-word-parser'

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
