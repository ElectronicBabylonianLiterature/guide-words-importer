import * as fs from 'fs'
import * as Papa from 'papaparse'
import {GuideWords} from './guide-words'

async function readFile(fileName: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => err ? reject(err) : resolve(data))
  })
}

function parseGuideWords(csv: string): readonly GuideWords[] | PromiseLike<readonly GuideWords[]> {
  return Papa.parse(csv, {
    header: true,
  }).data
}

export function parseFromFile(file: string): readonly GuideWords[] | PromiseLike<readonly GuideWords[]> {
  return readFile(file).then(parseGuideWords)
}
