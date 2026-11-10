import { DICTATION_SUBJECTS, type DictationSubject } from "@/types";

export function parseBatchText(text: string) {
  const entries: Array<{ answer: string; prompt: string; tags: string[] }> = [];
  const errors: Array<{ line: number; message: string }> = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const fields = line.split(/[|｜]/).map(field => field.trim());
    if (fields.length < 2 || fields.length > 3 || !fields[0] || !fields[1]) {
      errors.push({ line: index + 1, message: '请使用“答案 | 提示 | 标签”，答案和提示不能为空，标签可省略。' });
      return;
    }
    entries.push({ answer: fields[0], prompt: fields[1], tags: (fields[2] || '').split(/[,，]/).map(tag => tag.trim()).filter(Boolean) });
  });
  return { entries, errors };
}

const outputRules = `每条内容独占一行，格式为：答案 | 提示 | 标签。
按图片原有顺序输出，不擅自增加条目。
把所有录入行放在一个纯文本代码块中，块内不要标题、序号、表头、Markdown 表格或解释。
无法辨认的条目不要猜测，跳过并在代码块外单独说明。
字段内部不要使用竖线“|”或换行，多个标签用逗号分隔。`;

const batchPrompts: Record<DictationSubject, string> = {
  语文: `请识别我上传的语文图片中的生字和词语，转换成批量录入文本。

答案为图片中的汉字或词语，提示为带声调的拼音。图片未标注拼音时，请按词语语境补全。标签填“生字”或“词语”。

${outputRules}

格式示例（请勿作为识别结果输出）：
澜 | lán | 生字
波澜壮阔 | bō lán zhuàng kuò | 词语`,
  英语: `请识别我上传的英语图片中的单词、词组和句子，转换成批量录入文本。

答案为英文原文，保留大小写和标点；提示为中文释义，图片未提供时请补全。标签填“单词”“词组”或“句子”。

${outputRules}

格式示例（请勿作为识别结果输出）：
apple | 苹果 | 单词
great fun | 非常有趣 | 词组
The planes go very far. | 飞机飞得非常远。 | 句子`,
};

export function getBatchPrompts(subjectName: string | null) {
  return DICTATION_SUBJECTS
    .filter((subject) => subjectName === null || subject === subjectName)
    .map((subject) => ({ subject, prompt: batchPrompts[subject] }));
}
