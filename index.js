const fs = require('fs')
const translate = require('google-translate-api')
const translatte = require('translatte')
const dictReplace = require('./dictReplace')





const TAG_INFOS = '[Script Info]\r\n'
const TAG_STYLES = '[V4+ Styles]\r\n'
const TAG_EVENTS = '[Events]\r\n'
const KEY_STYLE = 'Style: '
const KEY_FORMAT = 'Format: '
const KEY_DIALOGUE = 'Dialogue: '
const KEY_TITLE = 'Title: '
const KEY_TEXT = 'Text'
const SIZE_CHUNCKS = 50

const init = async () => {
    const inputSubtitleData = readSubtitleFile('./sample.ass')
    const input = extractSection(inputSubtitleData)
    const sub = {
        raw: inputSubtitleData,
        infoSection: readSection(input.infoSection, TAG_INFOS),
        styleSection: readSection(input.stylesSection, TAG_STYLES),
        eventsSection: readSection(input.eventsSection, TAG_EVENTS),
    }

    await translateDialogues(sub)

    writeOutput(sub)

    fs.writeFileSync("subtitle.js", JSON.stringify(sub), { encoding: 'utf8', flag: 'w' })
}

const posTranslation = (t) => {
    const firstChar = t.from[0]
    const firstCharTo = t.to[0]

    let pos = t.to

    if (firstChar.toUpperCase() == firstChar && firstCharTo.toUpperCase() != firstCharTo) {
        pos = t.to.replace(firstCharTo, firstCharTo.toUpperCase())
    } else if (firstChar.toLowerCase() == firstChar && firstCharTo.toLowerCase() != firstCharTo) {
        pos = t.to.replace(firstCharTo, firstCharTo.toLowerCase())
    }

    t.pos = pos

    return addSpecialKeys(addBreakLineSubtitle(t))
}

const addSpecialKeys = (t) => {
    if (t.raw.indexOf('{') >= 0) {
        const chunckKeys = splitChunksKeys(t.raw)

        if (t.raw.indexOf('{') == 0 && chunckKeys.length == 1) {
            t.pos = chunckKeys[0].middle + t.pos
        } else if (chunckKeys.length == 2 && chunckKeys[1].before == '') {
            t.pos = chunckKeys[0].middle + chunckKeys[1].middle + t.pos
        } else {
            t.pending = true
            console.error('++Tag especifica não aplicada', t.raw)
        }
    }

    return t
}


const addBreakLineSubtitle = (t) => {
    if (t.raw.indexOf('\\N') > 0) {
        if (t.pos.length > 50) {
            const words = t.pos.split(' ')
            const middle = Math.ceil(words.length / 2)

            words.slice(0, middle)

            const nPos = words.slice(0, middle).join(' ') + '\\N' + words.slice(middle).join(' ')
            t.pos = nPos
        } else {
            t.pending = true
            console.log('++possivel \\N', t.pos)
        }
    }

    return t
}


const customFix = (s) => {
    let text = s

    for (let i = 0; i < dictReplace.length; i++) {
        const { from, to } = dictReplace[i];
        text = text.replace(from, to)
    }

    return text.trim()
}

const translateDialogues = async (sub) => {
    const { formatCols } = sub.eventsSection

    const TEXT_POSITION = formatCols.indexOf(KEY_TEXT)
    const translations = []

    const chuncks = splitChuncks(sub.eventsSection.vLines)
    for (let i = 0; i < chuncks.length; i++) {
        const rawTextBlock = chuncks[i].map(dialogueLine => splitDialogueLine(formatCols.length, dialogueLine)[TEXT_POSITION]);
        const fromTextBlock = rawTextBlock.map(removeBreakLineSub).map(s => s + '\r').map(removeKeys)

        const textBlockTranslated = (await translatte(fromTextBlock.join(''), { from: 'en', to: 'pt' })).text
        const textBlockTranslatedLines = textBlockTranslated.split('\r')

        if (rawTextBlock.length != textBlockTranslatedLines.length) {
            console.error('Tamanho do traduzido não bate com o original')
        }


        for (let j = 0; j < textBlockTranslatedLines.length; j++) {
            const raw = rawTextBlock[j]
            const from = fromTextBlock[j]
            const to = customFix(textBlockTranslatedLines[j])

            const translation = posTranslation({
                raw,
                from,
                to
            })

            translations.push(translation)

            const idx = i * SIZE_CHUNCKS + j

            if (translations[idx].raw == splitDialogueLine(formatCols.length, sub.eventsSection.vLines[idx])[TEXT_POSITION]) {
                sub.eventsSection.vLines[idx] = sub.eventsSection.vLines[idx].replace(translations[idx].raw, translations[idx].pos)
            } else {
                console.log('not  match', translations[idx].raw, splitDialogueLine(formatCols.length, sub.eventsSection.vLines[idx])[TEXT_POSITION])
            }
        }


    }

    sub.translations = translations

    sub.infoSection.vLines = sub.infoSection.vLines.map(s => s.replace('Title: English (US)', 'Title: Português (PT-BR)'))
}


const splitChuncks = (arr) => {
    const chuncks = []
    for (let i = 0; i < arr.length; i += SIZE_CHUNCKS) {
        const chunk = arr.slice(i, i + SIZE_CHUNCKS);
        chuncks.push(chunk)
    }
    return chuncks
}

const splitDialogueLine = (formatColsSize, dialogueLine) => {
    const dialogueCols = dialogueLine.split(KEY_DIALOGUE)[1].split(',')

    if (dialogueCols.length > formatColsSize) {
        return [...dialogueCols.slice(0, formatColsSize - 1), dialogueCols.slice(formatColsSize - 1).join(',')]
    }

    return dialogueCols
}


const readSection = (section, tag) => {
    const lines = splitOnBreakLine(section)
    const vo = { tag }

    if (lines[0].indexOf(KEY_FORMAT) >= 0)
        vo.formatCols = splitFormatLineCols(lines.shift())

    if (lines[0].indexOf(KEY_STYLE) >= 0 ||
        lines[0].indexOf(KEY_DIALOGUE) >= 0 ||
        lines[0].indexOf(KEY_TITLE) >= 0)
        vo.vLines = lines

    return vo
}

const splitFormatLineCols = (text) => text.split(KEY_FORMAT)[1].split(',').map(s => s.trim())

const readSubtitleFile = (filePath) => fs.readFileSync(filePath, { encoding: 'utf8' })

const extractSection = (data) => {
    const [header, eventsSection] = data.split(TAG_EVENTS)
    const [header2, stylesSection] = header.split(TAG_STYLES)
    const infoSection = header2.split(TAG_INFOS)[1].trim()

    return { infoSection, stylesSection, eventsSection }
}

const splitOnBreakLine = (text) => text.split('\n').filter(s => s).filter(s => s != '\r')


const writeOutput = (sub) => fs.writeFileSync("output.ass", formatOutput(sub), { encoding: 'utf8', flag: 'w' })

const formatOutput = ({ infoSection, styleSection, eventsSection }) => {
    return `
${infoSection.tag.trim()}
${infoSection.vLines.join('\n').trim()}

${styleSection.tag.trim()}
${KEY_FORMAT + styleSection.formatCols.join(', ').trim()}
${styleSection.vLines.join('\n').trim()}

${eventsSection.tag.trim()}
${KEY_FORMAT + eventsSection.formatCols.join(', ').trim()}
${eventsSection.vLines.join('\n').trim()}`.trim()
}

function removeBreakLineSub(text) {
    return text.replace('\\N', ' ').replace('\r', '')
}

function splitChunksKeys(text) {
    const chuncksFirstStep = text.split('{')
    const before = chuncksFirstStep[0]
    const stepRest = chuncksFirstStep.slice(1).join('{')
    const chuncksSecondStep = stepRest.split('}')
    const middle = chuncksSecondStep[0]
    const after = chuncksSecondStep.slice(1).join('}')


    const objReturn = {
        before,
        middle: `{${middle}}`,
        after,
        text
    }


    if (chuncksFirstStep.length <= 2) {
        return [objReturn]
    }

    return [objReturn, ...splitChunksKeys(after)]
}

function joinChunksKeys(chuncks) {
    const chunck = chuncks.shift()

    if (chuncks.length == 0) return `${chunck.before}${chunck.after}`

    return `${chunck.before}${joinChunksKeys(chuncks)}`
}

function removeKeys(text) {
    return joinChunksKeys(splitChunksKeys(text))
}


init()