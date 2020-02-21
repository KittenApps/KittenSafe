import React, { useState, useEffect, useMemo } from 'react';
import { Box, Button, Container, Dialog, DialogTitle, DialogActions, DialogContent, Fab, Grid,
         InputAdornment, Paper, TextField, Typography, useMediaQuery } from '@material-ui/core';
import { EditTwoTone, Subject } from '@material-ui/icons';
import { useTheme } from '@material-ui/core/styles';
import throttle from 'lodash.throttle';

export const MarkdownPreview = React.memo((props) => {
  console.log("render MarkdownPreview: ", props);
  const [content, setContent] = useState(null);
  const mdProcessor = useMemo(() => import(/* webpackChunkName: 'markdown' */ './markdownUtil')
    .then(mu => mu.unified().use(mu.parseMarkdown).use(mu.remarkEmoji).use(mu.remarkLinks)
      .use(mu.remark2rehype, {allowDangerousHTML: true}).use(mu.rehypeRawHTML).use(mu.rehypeSanitize)
      .use(mu.rehype2react, {createElement: React.createElement, Fragment: React.Fragment})),[]);
  useEffect(() => {mdProcessor.then(mp => mp.process(props.src).then(c => setContent(c.contents)));}, [props.src, mdProcessor]);

  return <div>{content}</div>
});

function MarkdownEditor(props){
  console.log("render MarkdownEditor: ", props);
  const [markdown, setMarkdown] = useState('');
  const [content, setContent] = useState(' ');
  const [filename, setFilename] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('xs'));
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const throttledMd = useMemo(() => throttle((markdown) => import(/* webpackChunkName: 'markdown' */ './markdownUtil')
    .then(mu => mu.unified().use(mu.parseMarkdown).use(mu.remarkEmoji).use(mu.remarkLinks)
      .use(mu.remark2rehype, {allowDangerousHTML: true}).use(mu.rehypeRawHTML).use(mu.rehypeSanitize)
      .use(mu.rehype2react, {createElement: React.createElement, Fragment: React.Fragment}))
    .then(mp => mp.process(markdown).then(c => setContent(c.contents))), 250), []);
  useEffect(() => setShowPreview(!isMobile), [isMobile]);
  useEffect(() => {showPreview && throttledMd(markdown);}, [markdown, showPreview, throttledMd]);
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
          <Grid spacing={3} container>
            <Grid item xs={6} key="text"><Box p={0} m={0}><TextField value={markdown} onChange={onChangeText} label="Enter Markdown file content" placeholder="**Enter your text here**" variant="outlined" multiline fullWidth/></Box></Grid>
            <Grid item xs={6} key="rendered"><Box p={0} m={0}><Paper elevation={3} style={{padding: 10}}><Typography variant="overline" gutterBottom>Markdown preview:</Typography>{content}</Paper></Box></Grid>
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
