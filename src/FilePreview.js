import React from 'react';
import { Card, CardHeader, Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  card: {
    width: '98%'
  },
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
      case 'text': element = <textarea value={props.src} className={classes.media} />; break;
      case 'video': element = <video src={props.src} className={classes.media} />; break;
      case 'audio': element = <audio src={props.src} className={classes.media} />; break;
      default: return null;
  }

  return (
    <Container maxWidth="md" disableGutters>
      <Card variant="outlined" className={classes.card}>
        <CardHeader title={`Preview of ${props.filename}`} subheader={props.mimeType} />
        {element}
      </Card>
    </Container>
  );
}

export default React.memo(FilePreview);
