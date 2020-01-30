import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';

const useStyles = makeStyles({
  card: {
    width: '98%',
  },
  media: {
    width: '100%',
    minHeight: 200
  },
});

function FilePreview(props){
  // console.log("render FilePreview");
  const classes = useStyles();

  if (!props.mimeType){
    return (null);
  }

  let element;

  switch (props.mimeType.split('/')[0]){
      case 'image': element = <img src={props.src} className={classes.media} alt=""/>; break;
      case 'text': element = <textarea value={props.src} className={classes.media} />; break;
      case 'video': element = <video src={props.src} className={classes.media} />; break;
      case 'audio': element = <audio src={props.src} className={classes.media} />; break;
      default: return (null);
  }

  return (
    <Card variant="outlined" className={classes.card}>
      <CardHeader title={`Preview of ${props.filename}`} subheader={props.mimeType} />
      {element}
    </Card>
  );
}

export default React.memo(FilePreview);
