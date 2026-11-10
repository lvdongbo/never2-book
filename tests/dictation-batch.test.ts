import assert from 'node:assert/strict';
import { parseBatchText } from '../src/lib/dictation-batch';
const result = parseBatchText('apple | 苹果 | 单词\r\n\r\ngreat fun | 非常有趣\n坏行\n | 提示\nword | | 标签\na | b | c | d');
assert.deepEqual(result.entries, [
  {answer:'apple', prompt:'苹果', tags:['单词']},
  {answer:'great fun', prompt:'非常有趣', tags:[]},
]);
assert.deepEqual(result.errors.map(e => e.line), [4,5,6,7]);
assert.deepEqual(parseBatchText(' \n').entries, []);
assert.deepEqual(parseBatchText('波澜壮阔｜bō lán zhuàng kuò｜词语，易错').entries[0].tags, ['词语','易错']);
console.log('Batch parser checks passed');
