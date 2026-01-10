import { useEffect, useState } from 'react'
import { useQuery, useSubscription } from '@apollo/client/react'
import {
  GetBudgetDocument,
  OnGamestateCreatedDocument,
} from '../graphql/generated/graphql'

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
  const { data, loading, error } = useQuery(GetBudgetDocument, {
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

  useSubscription(OnGamestateCreatedDocument, {
    variables: { saveId: saveId ?? 0 },
    skip: !saveId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.gamestateCreated) {
        setGamestates((prev) => [
          ...prev,
          subscriptionData.data.gamestateCreated,
        ])
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
