import React, { useState, useEffect } from 'react';
import { TextField } from '@material-ui/core';
import unified from 'unified'
import parseMarkdown from 'remark-parse'
import remarkEmoji from 'remark-emoji';
import remarkLinks from 'remark-external-links';
import remark2rehype from 'remark-rehype'
import rehypeRawHTML from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehype2react from 'rehype-react';
import throttle from 'lodash.throttle';

const mdProcessor = unified()
  .use(parseMarkdown).use(remarkEmoji).use(remarkLinks)
  .use(remark2rehype, {allowDangerousHTML: true}).use(rehypeRawHTML).use(rehypeSanitize)
  .use(rehype2react, {createElement: React.createElement, Fragment: React.Fragment});

export const MarkdownPreview = React.memo((props) => {
  const [content, setContent] = useState(null);
  useEffect(() => {mdProcessor.process(props.src).then(c => setContent(c.contents));}, [props.src]);

  return <div>{content}</div>
});

const throttledMd = throttle((markdown, setContent) => mdProcessor.process(markdown).then(c => setContent(c.contents)), 250);

function MarkdownEditor(props){
  const [markdown, setMarkdown] = useState('');
  const [content, setContent] = useState(null);
  useEffect(() => {throttledMd(markdown, setContent);}, [markdown]);

  const onChangeText = (e) => setMarkdown(e.target.value);

  return (
    <React.Fragment>
      <TextField value={markdown} onChange={onChangeText} label="Enter Markdown file content" rowsMax={10} placeholder="**Enter your text here**" variant="outlined" multiline fullWidth/>
      <div>{content}</div>
    </React.Fragment>
  );
}

export default React.memo(MarkdownEditor);
