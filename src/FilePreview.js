import React, { useState } from 'react';
import { Button, Card, CardHeader, Container, Dialog, DialogTitle, DialogActions, DialogContent,
         IconButton, Paper, TextField, useMediaQuery } from '@material-ui/core';
import { Fullscreen, Close } from '@material-ui/icons'
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { MarkdownPreview } from './MarkdownEditor';

const useStyles = makeStyles(theme => ({
  media: {
    width: '100%',
    height: 'auto'
  },
  close: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500]
  }
}));

export const isSupportedMimeType = (mt) => ['image', 'text', 'video', 'audio'].includes(mt.split('/')[0]);
export const isSupportedMimeType2 = (mt) => ['image', 'video', 'audio'].includes(mt.split('/')[0]);

function FilePreview(props){
  // console.log("render FilePreview");
  const classes = useStyles();
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const handleOpen = () => setFullScreenOpen(true);
  const handleClose = () => setFullScreenOpen(false);

  if (!props.mimeType){
    return null;
  }

  let element;
  let mw;
  let action = <IconButton onClick={handleOpen}><Fullscreen fontSize="large"/></IconButton>;

  switch (props.mimeType.split('/')[0]){
      case 'image': element = <img src={props.src} className={classes.media} alt=""/>; mw="sm"; break;
      case 'text': element = props.mimeType === 'text/markdown' ? <Paper elevation={3} style={{marginLeft: 10, marginRight: 10, marginBottom: 10, padding: 10, overflow: 'auto'}}><MarkdownPreview src={props.src} /></Paper> :
                              <TextField value={props.src} variant="outlined" label="Preview of text file:" InputProps={{readOnly: true}} style={{padding: 10}} rowsMax="20" fullWidth multiline/>; mw="xl"; break;
      case 'video': element = <video src={props.src} className={classes.media} autoPlay controls/>; mw="lg"; action=null; break;
      case 'audio': element = <audio src={props.src} className={classes.media} autoPlay controls/>; mw="sm"; action=null; break;
      default: return null;
  }

  return (
    <Container maxWidth={mw} disableGutters>
      <Card style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text'}} variant="outlined">
        <CardHeader title={`Preview of ${props.filename}`} subheader={props.mimeType} action={action}/>
        {element}
      </Card>
      {fullScreenOpen &&
        <Dialog open={fullScreenOpen} onClose={handleClose} fullScreen={fullScreen} maxWidth="xl" fullWidth={props.mimeType !== 'text/markdown'}>
          <DialogTitle style={{paddingRight: 60}}>{`Preview of ${props.filename} (${props.mimeType})`}<IconButton className={classes.close} onClick={handleClose}><Close/></IconButton></DialogTitle>
          <DialogContent style={{padding: 0}}>{element}</DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="secondary">Close full screen preview</Button>
          </DialogActions>
        </Dialog>
      }
    </Container>
  );
}

export default React.memo(FilePreview);
