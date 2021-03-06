import React, { useReducer, useContext, useEffect, useState } from 'react'
import { INIT } from '../consts'
import DataManagementReducer, { KEYS } from '../reducers/data-management'
import { httpContext } from './http'
export const dataManagementContext = React.createContext({
  dataManagement: {},
  setDataManagement: () => { },
  refresh: false,
  setRefresh: (refresh) => { },
  allCollections: [],
  setAllCollections: (collections) => { },
  currentPartitions: [],
  setCurrentPartitions: (partitions) => { }
})


const { Provider } = dataManagementContext

export const DataManagementProvider = ({ children }) => {
  const [refresh, setRefresh] = useState(false)
  const [allCollections, setAllCollections] = useState([])
  const [currentPartitions, setCurrentPartitions] = useState([])
  const { currentAddress } = useContext(httpContext)
  const [dataManagement, setDataManagement] = useReducer(DataManagementReducer, {
    /**
     *  data // search result
        formInit, // form value
     */
    vectorSearch: {},
    /**
     * data // search result
     */
    table: {},
    /**
     * tableName // for search partition
     * data // search result
     */
    partition: {}
  });

  useEffect(() => {
    if (!currentAddress || dataManagement[KEYS.vectorSearch][currentAddress]) return
    setDataManagement({
      type: INIT,
      payload: {
        keys: [KEYS.vectorSearch, KEYS.table, KEYS.partition],
        id: currentAddress,
        values: {
          [KEYS.vectorSearch]: {
            formInit: {},
            data: null
          },
          [KEYS.table]: {
            data: null
          },
          [KEYS.partition]: {
            tableName: "",
            data: null
          }
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAddress])

  return <Provider value={{
    dataManagement,
    setDataManagement,
    refresh,
    setRefresh,
    allCollections,
    setAllCollections,
    currentPartitions,
    setCurrentPartitions
  }}>{children}</Provider>
}
