import React, { useState } from 'react'
import axios from "axios";
import { message } from "antd";
import { HOST, PORT } from "@/consts";
import { useTranslation } from "react-i18next";
import { notification } from 'antd'

let hasError = false; // make sure only one error message
const axiosInstance = axios.create({
  timeout: 5000
});

axiosInstance.interceptors.response.use(
  function (res) {
    // Do something with res data
    if (res.data && res.data.code === 400) {
      message.error(res.data.data.msg);
      return res;
    }
    return res;
  },
  function (error) {
    if (hasError) {
      return Promise.reject(error);
    }

    if (error.response && error.response.data) {
      const { message: errMsg } = error.response.data;
      errMsg && message.error(errMsg);
      hasError = true;
      setTimeout(() => {
        hasError = false;
      }, 2000);
      return Promise.reject(error);
    }
    if (error.message) {
      hasError = true;
      setTimeout(() => {
        hasError = false;
      }, 2000);
      message.error(error.message);
    }
    return Promise.reject(error);
  }
);


export const httpContext = React.createContext({
  currentAddress: "", // the current milvus we use
  setCurrentAddress: () => { },
  restartNotify: () => { },
  // data management api
  getTables: () => { },
  createTable: () => { },
  deleteTable: () => { },
  createIndex: () => { },
  searchTable: () => { },
  searchVectors: () => { },
  getPartitions: () => { },
  createPartition: () => { },
  deletePartition: () => { },
  // config api
  getAdvancedConfig: () => { },
  getHardwareConfig: () => { },
  getMilvusConfigs: () => { },
  setMilvusConfig: () => { },
  getSystemConfig: () => { },
  updateAdvancedConfig: () => { },
  updateHardwareConfig: () => { },
  getHardwareType: () => { }
})


const { Provider } = httpContext

let timer = null

export const HttpProvider = ({ children }) => {
  const host = window.localStorage.getItem(HOST) || "";
  const port = window.localStorage.getItem(PORT) || "";
  const [currentAddress, setCurrentAddress] = useState(host && port ? `${host}:${port}` : '') // current milvus ip will store in localstorage
  const [restartNotifyStatus, setRestartNotifyStatus] = useState(false) // is restartnotify open
  const [restartStatus, setRestartStatus] = useState(false) // some config change . need to restart milvus
  const { t } = useTranslation();
  const notificationTrans = t("notification")

  const restartNotify = () => {
    const args = {
      message: notificationTrans.restart.title,
      description: notificationTrans.restart.desc,
      duration: 0,
      onClose: () => {
        setRestartNotifyStatus(false)
      }
    };
    notification.open(args);
    setRestartNotifyStatus(true)
    setRestartStatus(true)
  };
  axiosInstance.defaults.baseURL = `http://${currentAddress}`

  const httpWrapper = (httpFunc) => {
    return async function inner() {
      if (!currentAddress) {
        message.warning("Need connect to milvus first!", 3)
        hasError = true
        setTimeout(() => {
          hasError = false
        }, 2)
        return Promise.resolve()
      }
      console.log(restartStatus, timer)
      if (restartStatus) {
        if (timer) {
          clearTimeout(timer)
        }
        timer = setTimeout(async () => {
          const res = await getMilvusConfigs()
          const { restart_required } = res.reply
          if (!restartNotifyStatus && restart_required) {
            restartNotify()
          }
          if (!restart_required) {
            setRestartStatus(false)
          }
        }, 1000)
      }
      return httpFunc(...arguments)
    }
  }

  // ------- Data Management Start ----------

  async function searchVectors(data = {}) {
    const copyData = JSON.parse(JSON.stringify(data));
    delete copyData.tableName;
    const res = await axiosInstance.put(`/tables/${data.tableName}/vectors`, copyData);
    return res.data;
  }

  async function getTables(params = {}) {
    const res = await axiosInstance.get("/tables", { params });
    return res.data;
  }

  async function createTable(data) {
    const res = await axiosInstance.post("/tables", data);
    return res.data;
  }

  async function deleteTable(name) {
    const res = await axiosInstance.delete(`/tables/${name}`);
    return res.data;
  }

  async function createIndex(tableName, data = {}) {
    const res = await axiosInstance.post(`/tables/${tableName}/indexes`, data);
    return res.data;
  }

  async function searchTable(tableName) {
    const res = await axiosInstance.get(`/tables/${tableName}`);
    return res.data;
  }

  async function createPartition(tableName, data) {
    const res = await axiosInstance.post(`/tables/${tableName}/partitions`, data);
    return res.data;
  }

  async function getPartitions(tableName, params) {
    const res = await axiosInstance.get(`/tables/${tableName}/partitions`, { params })
    return res.data
  }

  async function deletePartition(tableName, tag) {
    const res = await axiosInstance.delete(`/tables/${tableName}/partitions/${tag}`)
    return res.data
  }
  // ------- Data Management End ----------

  // ------- config Api Start ----------
  async function getAdvancedConfig(params = {}) {
    const res = await axiosInstance.get("/config/advanced", { params });
    return res.data;
  }

  async function updateAdvancedConfig(data) {
    const res = await axiosInstance.put("/config/advanced", data);
    return res.data;
  }

  async function getHardwareConfig(params = {}) {
    const res = await axiosInstance.get("/config/gpu_resources", { params });
    return res.data;
  }

  async function updateHardwareConfig(data) {
    const res = await axiosInstance.put("/config/gpu_resources", data);
    return res.data;
  }

  async function setMilvusConfig(data) {
    const res = await axiosInstance.put("/system/config", data);
    return res.data
  }

  async function getMilvusConfigs() {
    const res = await axiosInstance.get("/system/config");
    return res.data
    // return {
    //   "reply": {
    //     "cache_config": { "cache_insert_data": "false", "cpu_cache_capacity": "4", "cpu_cache_threshold": "0.85", "insert_buffer_size": "1" },
    //     "db_config": { "archive_days_threshold": "0", "archive_disk_threshold": "0", "backend_url": "sqlite://czz:123@127.0.0.1:8000/", "preload_table": "" },
    //     "engine_config": { "gpu_search_threshold": "1000", "omp_thread_num": "0", "use_blas_threshold": "1100" },
    //     "gpu_resource_config": { "build_index_resources": ["gpu0"], "cache_capacity": "1", "cache_threshold": "0.85", "enable": "true", "search_resources": ["gpu0"] },
    //     "metric_config": { "address": "127.0.0.1", "enable_monitor": "false", "port": "9091" },
    //     "restart_required": true,
    //     "server_config": { "address": "0.0.0.0", "deploy_mode": "single", "port": "19530", "time_zone": "UTC+8", "web_port": "19122" },
    //     "storage_config": {
    //       "primary_path": "/tmp/milvus",
    //       "secondary_path": "/tmp,/tmp2"
    //     },
    //     "tracing_config": {
    //       "json_config_path": ""
    //     }
    //   }
    // }
  }

  async function getSystemConfig() {
    const res = await axiosInstance.get("/devices");
    res.data = { "cpu": { "memory": 31 }, "gpus": { "GPU0": { "memory": 7 }, "GPU1": { "memory": 10 } } }

    const { gpus, cpu = {} } = res.data || {};
    let gpuList = [];
    let cpuMemory = cpu.memory || 1000;
    let gpuMemory = 1000000;
    if (gpus) {
      gpuList = [...gpuList, ...Object.keys(gpus)];
      gpuMemory = gpuList.reduce((pre, cur) => {
        if (gpus[cur]) {
          return Math.min(pre, gpus[cur].memory);
        }
        return pre;
      }, gpuMemory);
    }
    return {
      gpuList,
      gpuMemory,
      cpuMemory
    };
  }

  async function getHardwareType() {
    const res = await axiosInstance.get("/system/mode");
    // return "CPU";
    return res.data ? res.data.reply || "CPU" : "CPU";
  }
  // ------- config Api End ----------

  return <Provider value={{
    currentAddress,
    setCurrentAddress,
    restartNotify,
    // config api
    getAdvancedConfig: httpWrapper(getAdvancedConfig),
    getHardwareConfig: httpWrapper(getHardwareConfig),
    setMilvusConfig: httpWrapper(setMilvusConfig),
    getMilvusConfigs: httpWrapper(getMilvusConfigs),
    getSystemConfig: httpWrapper(getSystemConfig),
    updateAdvancedConfig: httpWrapper(updateAdvancedConfig),
    updateHardwareConfig: httpWrapper(updateHardwareConfig),
    getHardwareType: httpWrapper(getHardwareType),
    // data management api
    searchVectors: httpWrapper(searchVectors),
    getTables: httpWrapper(getTables),
    createTable: httpWrapper(createTable),
    deleteTable: httpWrapper(deleteTable),
    createIndex: httpWrapper(createIndex),
    searchTable: httpWrapper(searchTable),
    createPartition: httpWrapper(createPartition),
    getPartitions: httpWrapper(getPartitions),
    deletePartition: httpWrapper(deletePartition)
  }}>{children}</Provider>
}
