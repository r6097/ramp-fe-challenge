import { Employee, PaginatedResponse, Transaction } from "../utils/types"

type UseTypeBaseResult<TValue> = {
  data: TValue
  loading: boolean
  invalidateData: () => void
}

type UseTypeBaseAllResult<TValue> = UseTypeBaseResult<TValue> & {
  fetchAll: () => Promise<void>
}

type PaginatedAllResult<TValue> = UseTypeBaseAllResult<TValue> & {
  checkNextPage: () => Promise<boolean>
}

type UseTypeBaseByIdResult<TValue> = UseTypeBaseResult<TValue> & {
  fetchById: (id: string) => Promise<void>
}

export type EmployeeResult = UseTypeBaseAllResult<Employee[] | null>

export type PaginatedTransactionsResult = PaginatedAllResult<PaginatedResponse<Transaction[]> | null>

export type TransactionsByEmployeeResult = UseTypeBaseByIdResult<Transaction[] | null>
