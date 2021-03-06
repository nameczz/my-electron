import React, { useContext, useState, useEffect } from 'react'
import { systemContext } from '../../context/system'
import { httpContext } from "../../context/http"
import { materialContext } from '../../context/material'
import { useTranslation } from "react-i18next";
import { useFormValidate } from '../../hooks/form'
import { FormTextField } from '../../components/common/FormTextComponents'
import FormActions from '../../components/common/FormActions'
const defaultForm = { address: "", port: "" }

const NetworkFrom = (props) => {
  const [form, setForm] = useState({ ...defaultForm })
  const [error, setError] = useState({})
  const [isFormChange, setIsformChange] = useState(false)
  const { validateForm, handleCheck, handleChange } = useFormValidate(form, setForm, setError)

  const { serverConfig } = useContext(systemContext)
  const { openSnackBar } = useContext(materialContext)
  const {
    currentAddress,
    setMilvusConfig,
    restartNotify
  } = useContext(httpContext)

  const { t } = useTranslation();
  const networkTrans = t("network");

  const handleSubmit = async e => {
    e.preventDefault();
    const isValid = validateForm()

    if (!isValid) {
      return
    }
    const res = await setMilvusConfig({ server_config: { ...form } })
    if (res && res.code === 0) {
      openSnackBar(t('submitSuccess'))
      setIsformChange(false);
      restartNotify()
    }
  };

  const handleCancel = () => {
    const currentConfig = serverConfig[currentAddress] || {}
    setForm({
      address: currentConfig.address || "",
      port: currentConfig.port || ""
    })
    setIsformChange(false)
  };

  useEffect(() => {
    handleCancel()
    // eslint-disable-next-line
  }, [currentAddress, serverConfig])


  return (
    <>
      <FormTextField
        name="address"
        label={networkTrans.address}
        value={form.address}
        onBlur={() => { handleCheck(form.address, "address") }}
        onChange={e => { handleChange(e); setIsformChange(true) }}
        placeholder={networkTrans.address}
        error={error.address}
        helperText={error.address && `${networkTrans.address}${t('required')}`}
      />
      <FormTextField
        name="port"
        label={networkTrans.port}
        value={form.port}
        onBlur={() => { handleCheck(form.port, "port") }}
        onChange={e => { handleChange(e); setIsformChange(true) }}
        placeholder={networkTrans.port}
        error={error.port}
        helperText={error.port && `${networkTrans.port}${t('required')}`}
      />
      <FormActions save={handleSubmit} cancel={handleCancel} disableCancel={!isFormChange} />
    </>

  );
}
export default NetworkFrom