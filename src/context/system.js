import React, { useState, useEffect, useReducer, useContext } from 'react'
import { httpContext } from './http'
import { notification } from 'antd'
import MilvusReducer from "../reducers/milvus-servers"
import { useTranslation } from "react-i18next";

export const systemContext = React.createContext({

  milvusAddress: {}, // all milvus server ip
  setMilvusAddress: () => { },
  globalNotify: () => { },
  /**
   * key: milvus address
   * value: {sysytemConfig: {}, version: ''}
   */
  systemInfos: {},
  /**
   * systemInfos[currentAddress]
   */
  currentSystemInfo: {},
  storageConfig: {},
  serverConfig: {},
  metricConfig: {},
  dbConfig: {}
})


const { Provider } = systemContext

export const SystemProvider = ({ children }) => {
  const [systemInfos, setSystemInfos] = useState({});
  const [storageConfig, setStorageConfig] = useState({})
  const [dbConfig, setDbConifg] = useState({})
  const [serverConfig, setServerConfig] = useState({})
  const [metricConfig, setMetricConfig] = useState({})

  const [milvusAddress, setMilvusAddress] = useReducer(MilvusReducer, {});
  const { currentAddress, getSystemConfig, getMilvusConfigs } = useContext(httpContext)
  const { t } = useTranslation();
  const notificationTrans = t("notification")

  const globalNotify = (title, desc, duration = 0) => {
    const args = {
      message: title || notificationTrans.restart.title,
      description: desc || notificationTrans.restart.desc,
      duration,
    };
    notification.open(args);
  };

  const getInfosFromUrl = (url) => {
    if (!url) return
    const type = url.includes('sqlite') ? "sqlite" : "mysql"
    const usrPwd = url.match(/\/\/(\S*)@/)[1];
    const username = usrPwd ? usrPwd.split(":")[0] : ""
    const password = usrPwd ? usrPwd.split(":")[1] : ""

    const hostPort = url.match(/@(\S*)\//)[1];
    const host = hostPort ? hostPort.split(":")[0] : ""
    const port = hostPort ? hostPort.split(":")[1] : ""
    return {
      type,
      username,
      password, host,
      port
    }
  }

  useEffect(() => {
    if (!currentAddress) return
    const fetchData = async () => {
      const res = await Promise.all([
        getSystemConfig(),
        getMilvusConfigs()
      ]);
      setSystemInfos(v => ({ ...v, [currentAddress]: { ...res[0] } }));
      const { storage_config = {}, server_config = {}, db_config = {}, metric_config = {}, restart_required = false } = res[1].reply || {}
      const backendUrl = db_config.backend_url
      const dbConfig = getInfosFromUrl(backendUrl)
      setStorageConfig(v => ({ ...v, [currentAddress]: { ...storage_config } }))
      setServerConfig(v => ({ ...v, [currentAddress]: { ...server_config } }))
      setMetricConfig(v => ({ ...v, [currentAddress]: { ...metric_config } }))
      setDbConifg(v => ({ ...v, [currentAddress]: { ...dbConfig } }))
      if (restart_required) {
        globalNotify()
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAddress]);

  return <Provider value={{
    currentSystemInfo: systemInfos[currentAddress] || {},
    systemInfos,
    storageConfig,
    serverConfig,
    metricConfig,
    dbConfig,

    milvusAddress,
    globalNotify,
    setMilvusAddress
  }}>{children}</Provider>
}