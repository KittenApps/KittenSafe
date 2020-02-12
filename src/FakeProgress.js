import React, { useState, useMemo, useEffect } from 'react';
import { Container, Grid, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { CheckBoxOutlineBlank, CheckBoxTwoTone } from '@material-ui/icons';
import { green } from '@material-ui/core/colors';

function FakeProgress(props){
  const [fakeProgress, setFakeProgress] = useState(-1);
  // console.log("render FakeProgress: ", props, fakeProgress);
  const limit = useMemo(() => props.catimation.length - 2, [props]);

  useEffect(() => {
    if (props.play) {
      setFakeProgress(0);
    } else {
      setFakeProgress(-1);
    }
  }, [props.play])

  useEffect(() => {
    if (fakeProgress > limit || fakeProgress < 0) return;
    const timeout = setTimeout(() => setFakeProgress(fakeProgress + 1), 300);
    return () => clearTimeout(timeout);
  }, [fakeProgress, limit]);

  return (
    <React.Fragment>
      <Container maxWidth="sm">
        <Grid container spacing={3}>
          {[0, 1, 2, 3, 4].map(i => <Grid item xs={2} key={i} style={{fontSize: 32}}>{props.catimation[fakeProgress > 0 ? fakeProgress : 0][i]}</Grid>)}
        </Grid>
      </Container>
      <List dense>
        {props.items.map((v, i) => (
          <ListItem key={i} dense>
            <ListItemIcon>
              {i < fakeProgress ? <CheckBoxTwoTone style={{ color: green[800] }} /> : <CheckBoxOutlineBlank /> }
            </ListItemIcon>
            <ListItemText primary={v} />
          </ListItem>
        ))}
      </List>
    </React.Fragment>
  );
}

export default React.memo(FakeProgress);
