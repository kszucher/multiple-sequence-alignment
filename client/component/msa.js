import React, { useEffect, useState } from 'react'
import  species  from './species.json'
import  nucleotides  from './nucleotides.json'

const VIEWBOX_A = {w:390, h:552}
const VIEWBOX_B = {w:300, h:552}
const VIEWBOX_C = {w:792, h:552}
const LETTER_SIZE = 24
const FONT_SIZE = 16
const PATH_DISTANCE = 30

const nucleotidColors = {
    '-': '#FFFFFF',
    A: '#f8a68d',
    C: '#f6a1a6',
    D: '#f284b2',
    E: '#cc69a7',
    F: '#ec7079',
    G: '#8869a6',
    H: '#b88bbe',
    I: '#b2bee1',
    K: '#91c4e8',
    L: '#8095cc',
    M: '#d1a5cc',
    N: '#f6dd6e',
    P: '#e9bebc',
    Q: '#75cbe8',
    R: '#a9dde4',
    S: '#80bfb0',
    T: '#b3ddd2',
    V: '#d2dde4',
    W: '#f5ba93',
    Y: '#ef9d6a',
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
            cs.map((arrEl, idx) => {
                speciesProcessor.parse(arrEl, [...path, 'p', idx])
            })
        } else {
            speciesProcessor.nucleotidMat.push([
                ...nucleotides.find(el => el.name === cs).sequence
            ])
            subsasgn(speciesProcessor.speciesStructure, path, {
                name: cs,
                nodeHeight: LETTER_SIZE
            })
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
    },
}

const SpeciesPath = ({el, highlight}) => {
    const {sx, sy, ex, ey} = el
    return (
        <path
            d={getEdgePath([sx, sy, ex, ey])}
            strokeWidth={highlight.highlight ? 4 : 2}
            stroke={highlight.highlight ? '#1D5567' : '#04AB96'}
            fill={'none'}
            vectorEffect={'non-scaling-stroke'}
        >
        </path>
    )
}

const SpeciesPathVisualizer = ({pathDescriptors, highlightDescriptors}) => {
    return (
        <svg viewBox={`0 0 ${VIEWBOX_A.w} ${VIEWBOX_A.h}`} style={{backgroundColor: '#ffffff'}}>
            {pathDescriptors.map((el, idx) => (
                <SpeciesPath
                    key={'unique' + Math.random(100)}
                    el={el}
                    idx={idx}
                    highlight={highlightDescriptors[idx]}/>
            ))}
        </svg>
    )
}

const NucleotidVisualizer = ({nucleotidMat, highlightIdx}) => {
    const horzLen = nucleotidMat[0]?.length
    const vertLen = nucleotidMat?.length
    const horzLinSpace = linspace(0, LETTER_SIZE*horzLen, horzLen, false)
    const vertLinSpace = linspace(0, LETTER_SIZE*vertLen, vertLen, false)
    const letterDescriptors = nucleotidMat
        .map((iEl, iIdx) => iEl
            .map((jEl, jIdx) => {
                return {
                    x: horzLinSpace[jIdx],
                    y: vertLinSpace[iIdx],
                    c: nucleotidMat[iIdx][jIdx],
                    fw: iIdx===highlightIdx ? 'bold' : 'normal'
                }})).flat()
    return (
        <svg viewBox={`0 0 ${VIEWBOX_C.w} ${VIEWBOX_C.h}`} style={{backgroundColor: '#dddddd'}}>
            {letterDescriptors.map((el, idx) => (
                <g key={idx}>
                    <rect
                        x={el.x}
                        y={el.y}
                        width={LETTER_SIZE}
                        height={LETTER_SIZE}
                        key={'rect' + el.x*10 + el.y}
                        fill={nucleotidColors[el.c]}
                    >
                    </rect>
                    <text
                        x={el.x + LETTER_SIZE / 2}
                        y={el.y + LETTER_SIZE / 2 + 3}
                        key={'text' + el.x*10 + el.y}
                        fontFamily="Roboto"
                        fontSize={FONT_SIZE}
                        fontWeight={el.fw}
                        fill="#000"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {el.c}
                    </text>
                </g>
            ))}
        </svg>
    )
}

export function Msa () {
    const [nucleotidMat, setNucleotidMat] = useState([])
    const [pathDescriptors, setPathDescriptors] = useState([])
    const [highlightIdx, setHighlightIdx] = useState('')
    const [highlightDescriptors, setHighlightDescriptors] = useState([])
    const nameHover = (name, idx) => {
        speciesProcessor.init(name)
        setHighlightIdx(idx)
        setHighlightDescriptors(speciesProcessor.highlightDescriptors.slice(0))
    }
    useEffect(() => {
        speciesProcessor.init('')
        setPathDescriptors(speciesProcessor.pathDescriptors)
        setHighlightDescriptors(speciesProcessor.highlightDescriptors)
        setNucleotidMat(speciesProcessor.nucleotidMat)
    }, [])
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            paddingTop: 100,
        }}>
            <div style={{
                fontSize: 30,
                fontFamily: 'Roboto',
                padding: 20
            }}>
                MULTI SEQUENCE ALIGNMENT
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: VIEWBOX_A.w + VIEWBOX_B.w + VIEWBOX_C.w,
                    height: VIEWBOX_A.h,
                    padding: 10,
                    backgroundColor: '#FFF',
                    borderRadius: 16,
                    cursor: 'pointer'
                }}>
                <div style={{ width: VIEWBOX_A.w, height: VIEWBOX_A.h }}>
                    {pathDescriptors.length && <SpeciesPathVisualizer
                        pathDescriptors={pathDescriptors}
                        highlightDescriptors={highlightDescriptors}
                    />}
                </div>
                <div style={{ width: VIEWBOX_B.w, height: VIEWBOX_B.h }}>
                    <svg viewBox={`0 0 ${VIEWBOX_B.w} ${VIEWBOX_B.h}`} style={{backgroundColor: '#FFFFFF'}}>
                        {nucleotides.map((el, idx) => (
                            <text
                                x={20}
                                y={idx*LETTER_SIZE + LETTER_SIZE / 2}
                                key={'text' + idx}
                                fontFamily="Roboto"
                                fontSize={FONT_SIZE}
                                fontWeight={idx===highlightIdx ? 'bold' : 'normal'}
                                fill="black"
                                textAnchor="start"
                                dominantBaseline="middle"
                                onMouseEnter={() => nameHover(el.name, idx)}
                            >
                                {el.name}
                            </text>
                        ))}
                    </svg>
                </div>
                <div style={{ width: VIEWBOX_C.w, height: VIEWBOX_C.h }}>
                    <NucleotidVisualizer
                        nucleotidMat={nucleotidMat}
                        highlightIdx={highlightIdx}
                    />
                </div>
            </div>
        </div>
    )
}
