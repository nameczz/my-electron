import React, { useState, useContext } from 'react'
import axios from "axios";
import { materialContext } from './material'
import { useTranslation } from "react-i18next";

let hasError = false; // make sure only one error message
const axiosInstance = axios.create({
  timeout: 5000
});

export const httpContext = React.createContext({
  currentAddress: "", // the current milvus we use
  setCurrentAddress: () => { },
  restartNotify: () => { },
  // data management api
  getCollections: () => { },
  getCollectionByName: (collectionName) => { },
  createCollection: () => { },
  deleteCollection: () => { },
  createIndex: () => { },
  searchCollection: () => { },
  searchVectors: (collectionName, data) => { },
  getPartitions: (Name, params) => { },
  createPartition: () => { },
  deletePartition: () => { },
  getSegments: (collectionName, params) => { },
  addVectors: (collectionName, data) => { },
  getVectors: (collectionName, segementName, params) => { },
  deleteVectors: (collectionName, data) => { },
  getVectorById: (collectionName, params) => { },
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
  const [currentAddress, setCurrentAddress] = useState('') // current milvus ip will store in localstorage
  const [restartStatus, setRestartStatus] = useState(false) // some config change . need to restart milvus
  const { t } = useTranslation();
  const notificationTrans = t("notification")
  const { openSnackBar } = useContext(materialContext)
  const restartNotify = () => {
    openSnackBar(notificationTrans.restart.desc, 'warning', null, { vertical: "top", horizontal: "right" })
    setRestartStatus(true)
  };
  axiosInstance.defaults.baseURL = `http://${currentAddress}`

  axiosInstance.interceptors.response.use(
    function (res) {
      // Do something with res data
      if (res.data && res.data.code === 400) {
        openSnackBar(res.data.data.msg, 'error')
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
        errMsg && openSnackBar(errMsg, 'error')
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
        openSnackBar(error.message, 'error')
      }
      return Promise.reject(error);
    }
  );

  const httpWrapper = (httpFunc) => {
    return async function inner() {
      if (!currentAddress) {
        openSnackBar("Need connect to milvus first!", 'warning')
        hasError = true
        setTimeout(() => {
          hasError = false
        }, 2)
        return Promise.resolve()
      }
      if (restartStatus) {
        if (timer) {
          clearTimeout(timer)
        }
        timer = setTimeout(async () => {
          const res = await getMilvusConfigs()
          const { restart_required } = res
          if (restart_required) {
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

  async function searchVectors(collectionName, data = {}) {
    const res = await axiosInstance.put(`/collections/${collectionName}/vectors`, data);
    return res.data;
  }

  async function getCollections(params = {}) {
    const res = await axiosInstance.get("/collections", { params });
    return res.data;
  }
  async function getCollectionByName(collectionName) {
    const res = await axiosInstance.get(`/collections/${collectionName}`);
    return res.data;
  }

  async function createCollection(data) {
    const res = await axiosInstance.post("/collections", data);
    return res.data;
  }

  async function deleteCollection(name) {
    const res = await axiosInstance.delete(`/collections/${name}`);
    return res.data;
  }

  async function createIndex(collectionName, data = {}) {
    const res = await axiosInstance.post(`/collections/${collectionName}/indexes`, data);
    return res.data;
  }

  async function searchCollection(collectionName) {
    const res = await axiosInstance.get(`/collections/${collectionName}`);
    return res.data;
  }

  async function createPartition(collectionName, data) {
    const res = await axiosInstance.post(`/collections/${collectionName}/partitions`, data);
    return res.data;
  }

  async function getPartitions(collectionName, params) {
    const res = await axiosInstance.get(`/collections/${collectionName}/partitions`, { params })
    return res.data
  }

  async function deletePartition(collectionName, data) {
    const res = await axiosInstance.delete(`/collections/${collectionName}/partitions`, { data })
    return res.data
  }

  async function getSegments(collectionName, params) {
    const res = await axiosInstance.get(`/collections/${collectionName}/segments`, { params })
    return res.data
  }
  async function addVectors(collectionName, data) {
    const res = await axiosInstance.post(`/collections/${collectionName}/vectors`, data)
    return res.data
  }
  async function getVectors(collectionName, segementName, params) {
    const res = await axiosInstance.get(`/collections/${collectionName}/segments/${segementName}/vectors`, { params })
    return res.data
  }

  async function deleteVectors(collectionName, data) {
    const res = await axiosInstance.put(`/collections/${collectionName}/vectors`, data);
    return res.data;
  }

  async function getVectorById(collectionName, params) {
    const res = await axiosInstance.get(`/collections/${collectionName}/vectors`, { params })
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
  // get and set all milsvus config, do not use other interface
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
  // All system config get by this like CPU, GPU
  async function getSystemConfig() {
    const res = await axiosInstance.get("/devices");
    // res.data = { "cpu": { "memory": 31 }, "gpus": { "GPU0": { "memory": 7 }, "GPU1": { "memory": 10 } } }

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
  // 
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
    getCollections: httpWrapper(getCollections),
    createCollection: httpWrapper(createCollection),
    deleteCollection: httpWrapper(deleteCollection),
    createIndex: httpWrapper(createIndex),
    searchCollection: httpWrapper(searchCollection),
    createPartition: httpWrapper(createPartition),
    getPartitions: httpWrapper(getPartitions),
    getCollectionByName: httpWrapper(getCollectionByName),
    deletePartition: httpWrapper(deletePartition),
    getSegments: httpWrapper(getSegments),
    addVectors: httpWrapper(addVectors),
    getVectors: httpWrapper(getVectors),
    deleteVectors: httpWrapper(deleteVectors),
    getVectorById: httpWrapper(getVectorById)
  }}>{children}</Provider>
}
