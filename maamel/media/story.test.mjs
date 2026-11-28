import test from 'node:test'
import assert from 'node:assert/strict'
import {pack} from '../av/model.mjs'
import {gradeStory} from './story.mjs'
test('forest story checks distinct media, audio, frame-specific edits and current export',()=>{
 const img=i=>'data:image/jpeg;base64,'+i.repeat(128)
 const story={scenes:[{src:img('a'),title:'الحيوانات في الغابة',style:'adventure',effect:'sparkles'},{src:img('b'),motion:'panzoom'}],audio:{pcm:pack(Uint8Array.of(128,200,90))},revision:7,exportRevision:7}
 assert.equal(gradeStory(story,'forest-story').score,100)
 assert.equal(gradeStory({...story,revision:8},'forest-story').score,83)
 assert.ok(gradeStory({...story,scenes:[story.scenes[0],story.scenes[0]]},'forest-story').score<100)
 assert.equal(gradeStory({},'gardens-film').score,0)
})
