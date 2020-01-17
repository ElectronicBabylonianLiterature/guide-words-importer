import {Command, flags} from '@oclif/command'
import * as _ from 'lodash'
import {setGuideWords} from './fragment-repository'
import {parseFromFile} from './guide-word-parser'
import {GuideWords} from './guide-words'

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
      const [guideWords] = await parseFromFile(file).then(guideWords => {
        function isGood(guideWord: GuideWords) {
          const guideWordCount = _(guideWords)
          .filter(candidate => candidate.lemma === guideWord.lemma && candidate.eblHomonym === guideWord.eblHomonym)
          .uniqBy('eblGuideWord')
          .size()
          return guideWordCount === 1
        }
        return _.partition(guideWords, isGood)
      })

      this.log(`Updating guide words to MongoDB ${host}...`)
      await setGuideWords(host, guideWords)
    } catch (error) {
      this.error(error)
    }
  }
}

export = GuideWordsImporter
