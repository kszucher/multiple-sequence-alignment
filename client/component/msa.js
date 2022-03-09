import React, { useEffect, useState } from 'react'
import  species  from './species.json'
import  nucleotides  from './nucleotides.json'

const VIEWBOX_A = {w:260, h:552}
const VIEWBOX_B = {w:300, h:VIEWBOX_A.h}
const VIEWBOX_C = {w:792, h:VIEWBOX_A.h}
const VIEWBOX_D = {w:VIEWBOX_A.w+VIEWBOX_B.w, h: 100}
const VIEWBOX_E = {w:VIEWBOX_C.w, h:VIEWBOX_D.h}
const LETTER_SIZE = 24
const FONT_SIZE = 16
const PATH_DISTANCE = 20

const da = {display: 'flex', alignItems: 'center'}
const pb = {padding: 10, backgroundColor: '#FFF'}
const svgFont = {fontFamily:"Roboto", fontSize:FONT_SIZE, fill:"#000", textAnchor:"middle", dominantBaseline:"middle"}

const nucleotidColors = {
    '-': '#FFFFFF', A: '#f8a68d', C: '#f6a1a6', D: '#f284b2', E: '#cc69a7', F: '#ec7079', G: '#8869a6',
    H: '#b88bbe', I: '#b2bee1', K: '#91c4e8', L: '#8095cc', M: '#d1a5cc', N: '#f6dd6e', P: '#e9bebc',
    Q: '#75cbe8', R: '#a9dde4', S: '#80bfb0', T: '#b3ddd2', V: '#d2dde4', W: '#f5ba93', Y: '#ef9d6a',
}

const subsasgn = (obj, path, value) => {
    let pathEnd = path.pop();
    for(let i = 0; i < path.length; i++) {
        obj = obj[path[i]] = obj[path[i]] || []
    }
    obj[ pathEnd ] = value;
}

const linspace = (start, stop, num, endpoint = true) => {
    const div = endpoint ? (num - 1) : num;
    const step = (stop - start) / div;
    return Array.from({length: num}, (_, i) => start + step * i);
}

const transpose = (matrix) => matrix.reduce((prev, next) => next.map((item, i) => (prev[i] || []).concat(next[i])), [])

const occurrences = (arr) => arr.reduce( (acc, curr) => (acc[curr] ? ++acc[curr] : acc[curr] = 1, acc), {})

const maxOccurence = (obj, ) => Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b)

const getEdgePath = ([x1, y1, x2, y2]) => {
    const dx = PATH_DISTANCE
    const dy = y2-y1
    const dir = 1
    const m1x = x1 + dir * dx / 2
    const m1y = y1
    const m2x = x1 + dir * dx / 2
    const m2y = y1 + dy
    const M = 'M'
    return `${M}${x1},${y1}, L${m1x},${m1y}, L${m2x},${m2y}, L${x2},${y2}`
}

const getCoords = (e) => {
    const nRect = document.getElementById('nRect')
    const rect = nRect.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return [x, y]
}

const speciesProcessor = {
    speciesStructure: {},
    numSpecies: 0,
    maxDepth: 0,
    nucleotidMat: [],
    pathDescriptors: [],
    highlightDescriptors: [],
    nameHighlight: '',
    init: (nameHighlight) => {
        speciesProcessor.pathDescriptors = []
        speciesProcessor.highlightDescriptors = []
        speciesProcessor.nameHighlight = nameHighlight
        if (Object.keys(speciesProcessor.speciesStructure).length === 0) {
            speciesProcessor.parse(species, [])
        }
        speciesProcessor.measure(speciesProcessor.speciesStructure, [])
        speciesProcessor.place(speciesProcessor.speciesStructure)

    },
    parse: (cs, path) => {
        if (Array.isArray(cs)) {
            cs.map((arrEl, idx) => {speciesProcessor.parse(arrEl, [...path, 'p', idx])})
        } else {
            speciesProcessor.nucleotidMat.push([...nucleotides.find(el => el.name === cs).sequence])
            subsasgn(speciesProcessor.speciesStructure, path, { name: cs, nodeHeight: LETTER_SIZE })
        }
    },
    measure: (cn, path) => {
        cn.path = path
        cn.highlight = 0
        if (cn.path.length > speciesProcessor.maxDepth) {
            speciesProcessor.maxDepth = cn.path.length/2
        }
        if (!cn.hasOwnProperty('nodeHeight')) {
            cn.nodeHeight = 0
        }
        if (cn.hasOwnProperty('p')) {
            const childCount = Object.keys(cn.p).length
            for (let i = 0; i < childCount; i++) {
                speciesProcessor.measure(cn.p[i], [...cn.path, 'p', i])
                if (cn.p[i].hasOwnProperty('nodeHeight')) {
                    cn.nodeHeight += cn.p[i].nodeHeight
                }
            }
        }
    },
    place: (cn) => {
        cn.nodeX = VIEWBOX_A.w - (speciesProcessor.maxDepth - cn.path.length/2) * PATH_DISTANCE
        cn.nodeY = (speciesProcessor.numSpecies * LETTER_SIZE + cn.nodeHeight / 2)
        if (cn.hasOwnProperty('p')) {
            cn.p.map(cnp => {
                speciesProcessor.place(cnp)
                speciesProcessor.pathDescriptors.push({
                    sx: cn.nodeX,
                    sy: cn.nodeY,
                    ex: cnp.nodeX + (cnp.hasOwnProperty('p') ? 0 : VIEWBOX_A.w),
                    ey: cnp.nodeY,

                })
                speciesProcessor.highlightDescriptors.push({
                    highlight: cnp.highlight || cnp.name === speciesProcessor.nameHighlight
                })
                cn.highlight = (cnp.hasOwnProperty('p'))
                    ? cn.highlight + cnp.highlight
                    : cn.highlight + (cnp.name === speciesProcessor.nameHighlight)
            })
        } else {
            speciesProcessor.numSpecies++
        }
    }
}

const SpeciesPathVisualizer = ({pathDescriptors, highlightDescriptors}) => {
    return (
        <svg viewBox={`0 0 ${VIEWBOX_A.w} ${VIEWBOX_A.h}`} style={{backgroundColor: '#ffffff'}}>
            {pathDescriptors.map(({sx, sy, ex, ey}, idx) => (
                <path
                    d={getEdgePath([sx, sy, ex, ey])}
                    strokeWidth={highlightDescriptors[idx].highlight ? 4 : 1}
                    stroke={highlightDescriptors[idx].highlight ? '#1D5567' : '#04AB96'}
                    fill={'none'}
                    vectorEffect={'non-scaling-stroke'}
                    key={Math.random()}
                >
                </path>
            ))}
        </svg>
    )
}

const NameVisualizer = ({highlightIdx}) => (
    <svg viewBox={`0 0 ${VIEWBOX_B.w} ${VIEWBOX_B.h}`} style={{backgroundColor: '#FFFFFF'}}>
        {nucleotides.map(({name}, idx) => (
            <text
                x={20}
                y={idx*LETTER_SIZE + LETTER_SIZE / 2}
                key={'text' + idx}
                fontFamily="Roboto"
                fontSize={FONT_SIZE}
                fontWeight={idx===highlightIdx ? 'bold' : 'normal'}
                fill={idx===highlightIdx ? '#1D5567' : '#04AB96'}
                textAnchor="start"
                dominantBaseline="middle"
            >
                {name}
            </text>
        ))}
    </svg>
)

const NucleotidVisualizer = React.memo(({letterDescriptors}) => (
    <g>
        {letterDescriptors.map(({x, y, c}, idx) => (
            <g key={idx}>
                <rect x={x} y={y} width={LETTER_SIZE} height={LETTER_SIZE} key={Math.random()}
                      fill={nucleotidColors[c]}
                      fillOpacity={0.6}
                >
                </rect>
                <text x={x + LETTER_SIZE / 2} y={y + LETTER_SIZE / 2 + 3} key={Math.random()} {...svgFont}>
                    {c}
                </text>
            </g>
        ))}
    </g>
))

const Target = ({hoverPos, hoverLen}) => {
    const format = {stroke:'#1D5567', strokeWidth:2, fill: 'none'}
    return (
        <g>
            <rect x={hoverPos[0]*LETTER_SIZE} y={0} width={LETTER_SIZE} height={hoverLen[1]*LETTER_SIZE} {...format}/>
            <rect x={0} y={hoverPos[1]*LETTER_SIZE} width={hoverLen[0]*LETTER_SIZE} height={LETTER_SIZE} {...format}/>

        </g>
    )
}

const ResultVisualizer = ({resultDescriptors}) => (
    <svg viewBox={`0 0 ${VIEWBOX_E.w} ${VIEWBOX_E.h}`} style={{}}>
        {resultDescriptors.map(({x, y, h, c}, idx) => (
            <g key={idx}>
                <rect x={x} y={y} width={LETTER_SIZE} height={h*4} key={Math.random()} fill={nucleotidColors[c]}>
                </rect>
                <text x={x + LETTER_SIZE / 2} y={LETTER_SIZE / 2} key={'text' + x*10 + y}{...svgFont}>
                    {c}
                </text>
            </g>
        ))}
    </svg>
)

export function Msa () {
    const [letterDescriptors, setLetterDescriptors] = useState([])
    const [resultDescriptors, setResultDescriptors] = useState([])
    const [pathDescriptors, setPathDescriptors] = useState([])
    const [highlightIdx, setHighlightIdx] = useState('')
    const [highlightDescriptors, setHighlightDescriptors] = useState([])
    const [hoverPos, setHoverPos] = useState([0,0])
    const [hoverLen, setHoverLen] = useState([0,0])
    const calcHover = e => {
        const coords = getCoords(e).map(el => (Math.floor(el/LETTER_SIZE)))
        setHoverPos(coords)
        speciesProcessor.init((nucleotides)[coords[1]].name)
        setHighlightIdx(coords[1])
        setHighlightDescriptors(speciesProcessor.highlightDescriptors.slice(0))
    }
    useEffect(() => {
        speciesProcessor.init('')
        const nucleotidMat = speciesProcessor.nucleotidMat
        const nucleotidMatT = transpose(speciesProcessor.nucleotidMat)
        const mostFrequent = nucleotidMatT.map(el => occurrences(el))
        const horzLen = speciesProcessor.nucleotidMat[0]?.length
        const vertLen = speciesProcessor.nucleotidMat?.length
        const horzLinSpace = linspace(0, LETTER_SIZE*horzLen, horzLen, false)
        const vertLinSpace = linspace(0, LETTER_SIZE*vertLen, vertLen, false)
        setLetterDescriptors(nucleotidMat
            .map((iEl, iIdx) => iEl
                .map((jEl, jIdx) => ({
                    x: horzLinSpace[jIdx],
                    y: vertLinSpace[iIdx],
                    c: nucleotidMat[iIdx][jIdx],
                }))).flat())
        setResultDescriptors(mostFrequent.map((el, idx) => ({
            x: horzLinSpace[idx],
            c: maxOccurence(el),
            h: el[maxOccurence(el)]
        })))
        setPathDescriptors(speciesProcessor.pathDescriptors)
        setHighlightDescriptors(speciesProcessor.highlightDescriptors)
        setHoverLen([horzLen, vertLen])
    }, [])
    return (
        <div style={{ ...da, flexDirection: 'column', paddingTop: 100, flexWrap: 'wrap',  }}>
            <div style={{ ...pb, borderRadius: '16px 16px 0 0', fontSize: 30, fontFamily: 'Roboto', color: '#1D5567' }}>
                {'MULTI SEQUENCE ALIGNMENT'}
            </div>
            <div style={{ ...da, ...pb, borderRadius: '16px 16px 0 16px'}}>
                <div style={{ width: VIEWBOX_A.w, height: VIEWBOX_A.h }}>
                    <SpeciesPathVisualizer {...{pathDescriptors}} {...{highlightDescriptors}}/>
                </div>
                <div style={{ width: VIEWBOX_B.w, height: VIEWBOX_B.h }}>
                    <NameVisualizer  {...{highlightIdx}} />
                </div>
                <div id='nRect' onMouseMove={e=>calcHover(e)} style={{ width: VIEWBOX_C.w, height: VIEWBOX_C.h }}>
                    <svg viewBox={`0 0 ${VIEWBOX_C.w} ${VIEWBOX_C.h}`}>
                        <NucleotidVisualizer letterDescriptors={letterDescriptors}/>
                        <Target hoverPos={hoverPos} hoverLen={hoverLen}/>
                    </svg>
                </div>
            </div>
            <div style={{ ...da, cursor: 'pointer' }}>
                <div style={{ width: VIEWBOX_D.w, height: VIEWBOX_D.h }}>
                </div>
                <div style={{ ...pb, borderRadius: '0 0 16px 16px', width: VIEWBOX_E.w, height: VIEWBOX_E.h }}>
                    <ResultVisualizer resultDescriptors={resultDescriptors}/>
                </div>
            </div>
        </div>
    )
}
