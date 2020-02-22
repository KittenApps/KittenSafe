import React from 'react';
import { Card, CardHeader, Container, Paper, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { MarkdownPreview } from './MarkdownEditor';

const useStyles = makeStyles({
  media: {
    width: '100%',
    minHeight: 200
  }
});

export const isSupportedMimeType = (mt) => ['image', 'text', 'video', 'audio'].includes(mt.split('/')[0]);
export const isSupportedMimeType2 = (mt) => ['image', 'video', 'audio'].includes(mt.split('/')[0]);

function FilePreview(props){
  // console.log("render FilePreview");
  const classes = useStyles();

  if (!props.mimeType){
    return null;
  }

  let element;

  switch (props.mimeType.split('/')[0]){
      case 'image': element = <img src={props.src} className={classes.media} alt=""/>; break;
      case 'text': element = props.mimeType === 'text/markdown' ? <Paper elevation={3} style={{marginLeft: 10, marginRight: 10, marginBottom: 10, padding: 10, overflow: 'auto'}}><MarkdownPreview src={props.src} /></Paper> : <TextField value={props.src}
        variant="outlined" label="Preview of text file:" InputProps={{readOnly: true}} style={{padding: 10}} fullWidth multiline/>; break;
      case 'video': element = <video src={props.src} className={classes.media} />; break;
      case 'audio': element = <audio src={props.src} className={classes.media} />; break;
      default: return null;
  }

  return (
    <Container maxWidth="md" style={{marginBottom: 10}} disableGutters>
      <Card variant="outlined">
        <CardHeader title={`Preview of ${props.filename}`} subheader={props.mimeType} />
        {element}
      </Card>
    </Container>
  );
}

export default React.memo(FilePreview);
