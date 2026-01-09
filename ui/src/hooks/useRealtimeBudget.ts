import { useEffect, useState } from 'react'
import { useQuery, useSubscription } from '@apollo/client/react'
import { graphql } from '../graphql/generated'

const GET_BUDGET = graphql(`
  query GetBudget($filename: String!) {
    save(filename: $filename) {
      saveId
      filename
      name
      gamestates {
        gamestateId
        date
        budget {
          balance {
            countryBase {
              energy
              minerals
              food
              trade
              alloys
              consumerGoods
              unity
              influence
            }
          }
        }
      }
    }
  }
`)

const ON_GAMESTATE_CREATED = graphql(`
  subscription OnGamestateCreated($saveId: Int!) {
    gamestateCreated(saveId: $saveId) {
      gamestateId
      date
      budget {
        balance {
          countryBase {
            energy
            minerals
            food
            trade
            alloys
            consumerGoods
            unity
            influence
          }
        }
      }
    }
  }
`)

interface BudgetData {
  gamestateId: number
  date: string
  budget: {
    balance: {
      countryBase: {
        energy: number | null
        minerals: number | null
        food: number | null
        trade: number | null
        alloys: number | null
        consumerGoods: number | null
        unity: number | null
        influence: number | null
      } | null
    } | null
  } | null
}

export interface UseRealtimeBudgetResult {
  gamestates: BudgetData[]
  loading: boolean
  error?: Error
  saveName?: string
  saveId?: number
}

export const useRealtimeBudget = (
  filename: string,
): UseRealtimeBudgetResult => {
  const { data, loading, error } = useQuery(GET_BUDGET, {
    variables: { filename },
    skip: !filename,
  })

  const [gamestates, setGamestates] = useState<BudgetData[]>([])
  const saveId = data?.save?.saveId

  useEffect(() => {
    if (data?.save?.gamestates) {
      setGamestates(data.save.gamestates)
    }
  }, [data])

  useSubscription(ON_GAMESTATE_CREATED, {
    variables: { saveId: saveId ?? 0 },
    skip: !saveId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.gamestateCreated) {
        setGamestates((prev) => [...prev, subscriptionData.data.gamestateCreated])
      }
    },
  })

  return {
    gamestates,
    loading,
    error: error ? new Error(error.message) : undefined,
    saveName: data?.save?.name,
    saveId,
  }
}
