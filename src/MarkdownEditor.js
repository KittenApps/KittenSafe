import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Dialog, DialogTitle, DialogActions, DialogContent, Fab, Grid,
         InputAdornment, Paper, TextField, Typography, useMediaQuery } from '@material-ui/core';
import { EditTwoTone, Subject } from '@material-ui/icons';
import { useTheme } from '@material-ui/core/styles';
import throttle from 'lodash.throttle';

import unified from 'unified'
import parseMarkdown from 'remark-parse'
import remarkEmoji from 'remark-emoji';
import remarkLinks from 'remark-external-links';
import remark2rehype from 'remark-rehype'
import rehypeRawHTML from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehype2react from 'rehype-react';

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
  const [content, setContent] = useState(' ');
  const [filename, setFilename] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('xs'));
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  useEffect(() => setShowPreview(!isMobile), [isMobile]);
  useEffect(() => {showPreview && throttledMd(markdown, setContent);}, [markdown, showPreview]);
  if (!props.open) return null;

  const handleClose = () => props.setOpen(false);
  const onChangeText = e => setMarkdown(e.target.value);
  const onChangeFilename = e => setFilename(e.target.value);
  const handleFab = () => setShowPreview(!showPreview);
  const handleSubmit = () => {
    props.setFile({markdown, size: markdown.length, name: (filename || 'text') + '.md', type: 'text/markdown'});
    props.setOpen(false);
  };

  return (
    <Dialog open={props.open} onClose={handleClose} fullScreen={fullScreen} maxWidth="xl" fullWidth>
      <DialogTitle>KittenSafe Markdown Editor</DialogTitle>
      {isMobile ?
        <React.Fragment>
          <Fab size="small" color="secondary" style={{position: 'fixed', right: 4, top: 52, zIndex: 100000}} onClick={handleFab} >{showPreview ? <EditTwoTone/> : <Subject/>}</Fab>
          <DialogContent>
            <Box hidden={showPreview} style={{marginBottom: 4}}><TextField value={markdown} onChange={onChangeText} label="Enter Markdown file content" placeholder="**Enter your text here**" variant="outlined" multiline fullWidth/></Box>
            <Paper elevation={3} style={{padding: 5, height: '100%', overflow: 'scroll'}} hidden={!showPreview} ><Typography variant="overline" gutterBottom>Markdown preview:</Typography>{content}</Paper>
          </DialogContent>
          <Container><TextField value={filename} onChange={onChangeFilename} label="Title (filename)" placeholder="text" InputProps={{endAdornment: <InputAdornment position="end">.md</InputAdornment>}} fullWidth/></Container>
        </React.Fragment>
        :
        <DialogContent>
          <Grid container spacing={3} style={{height: '100%'}}>
            <Grid item xs={6} key="text"><TextField value={markdown} onChange={onChangeText} label="Enter Markdown file content" placeholder="**Enter your text here**" variant="outlined" multiline fullWidth/></Grid>
            <Grid item xs={6} key="rendered"><Paper elevation={3} style={{padding: 10}}><Typography variant="overline" gutterBottom>Markdown preview:</Typography>{content}</Paper></Grid>
          </Grid>
          <TextField value={filename} onChange={onChangeFilename} label="Title (filename)" placeholder="text" InputProps={{endAdornment: <InputAdornment position="end">.md</InputAdornment>}} fullWidth/>
        </DialogContent>
      }
      <DialogActions>
        <Button onClick={handleClose} color="secondary">Abort</Button>
        <Button onClick={handleSubmit} color="primary">Submit Markdown as file</Button>
      </DialogActions>
    </Dialog>
  );
}

export default React.memo(MarkdownEditor);
