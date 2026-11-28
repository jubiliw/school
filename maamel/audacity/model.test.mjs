import assert from 'node:assert/strict'
import test from 'node:test'
import {grade,sample,mix} from './model.mjs'
import {pack,wav} from '../av/model.mjs'
test('saved forest mix checks distinct audible tracks, speed and actual exported waveform',()=>{
 const tracks=[0,1].map(i=>({pcm:pack(sample(i)),gain:.6,speed:i===1?1.5:1,offset:i/4}))
 const pcm=mix(tracks), exported={name:'G5.S2.2.1_Sample2.wav',pcm:pack(pcm)}
 assert.equal(grade(JSON.parse(JSON.stringify({tracks,exported}))).score,100)
 assert.equal(new TextDecoder().decode(wav(pcm).slice(0,4)),'RIFF')
 tracks[1].gain=.1
 assert.ok(grade({tracks,exported}).score<100)
})
