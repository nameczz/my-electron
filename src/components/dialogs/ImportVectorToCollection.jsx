import React, { useRef, useContext } from 'react';
import useStyles from './Style'
import Grid from '@material-ui/core/Grid';
import { DialogActions, DialogContent, DialogTitle, Button } from '@material-ui/core'
import { FaUpload } from 'react-icons/fa';
import { materialContext } from '../../context/material'
import { useTranslation } from 'react-i18next'
import { exportCsv } from '../../utils/helpers'


const example = [
  { value: '[1,2,3,4]' },
  { value: '[2,2,3,2]' },
  { value: '[3,2,3,5]' },
  { value: '[4,2,5,3]' },
]

const ImportVectorToCollection = props => {
  const classes = useStyles()
  const { t } = useTranslation()
  const vectorTrans = t('vector')
  const { importVectors = () => { }, partitionTag, dimension } = props;
  const Input = useRef(null)
  const { openSnackBar, hideDialog } = useContext(materialContext)


  const uploadFile = e => {
    const form = Input.current;
    const reader = new FileReader()
    reader.onload = async function (e) {
      // Use reader.result
      const csv = reader.result;
      const regex = /"([^"]*)"/g;
      let currentResult;
      let results = [];
      const errors = []
      while ((currentResult = regex.exec(csv)) !== null) {
        results.push(currentResult[1]);
      }

      results.forEach((v, i) => {
        try {
          JSON.parse(v)
          return false
        } catch (error) {
          errors.push(i)
        }
      })

      if (errors.length) {
        openSnackBar(`Rows ${errors.join(', ')} wrong format`, 'error')
        return
      }

      results = results.map(v => {
        try {
          const val = JSON.parse(v)
          return val
        } catch (error) {
          console.log(error)
          openSnackBar(`${v}  wrong format`, 'error')
          return v
        }
      })
      console.log(results)
      await importVectors(results)
      hideDialog()
    }
    reader.onerror = function (e) {
      console.log(e)
    }
    form.onchange = e => {
      const file = e.target.files[0];
      if (!file || file.type !== "text/csv") {
        openSnackBar(vectorTrans.error.fileType, 'warning')
        return
      }
      reader.readAsText(file, 'utf8')

      //TODO: do something with file
    }
    form.click()
  }

  const handleDownloadExample = () => {
    exportCsv('import-vectors-example', example)
  }
  return (
    <>
      <DialogTitle >
        {`${vectorTrans.import} ${partitionTag}`}
        <Button onClick={handleDownloadExample}>Example Download</Button>
      </DialogTitle>
      <DialogContent classes={{ root: classes.dialogContent }}>
        <Grid classes={{ root: classes.gridRoot }} container spacing={3}>
          <Grid item sm={12} onClick={uploadFile}>
            <div className={classes.upload}>
              <FaUpload size={100} />
            </div>
          </Grid>
          <Grid item xs={12}>
            <p className={classes.upload}>{`Please make sure the csv you upload contains ${dimension} dimensions vectors`}</p>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {/* <Button variant="outlined" onClick={() => update()} color="primary">
          {buttonTrans.import}
        </Button>
        <Button variant="outlined" onClick={() => hideDialog()} color="primary">
          {buttonTrans.cancel}
        </Button> */}
      </DialogActions>
      <input ref={Input} id='fileid' type='file' style={{ display: 'none' }} />
    </>)
}

export default ImportVectorToCollection