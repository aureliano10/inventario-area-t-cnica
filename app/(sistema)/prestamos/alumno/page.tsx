import { Suspense } from "react"
import { StudentLoanScreen } from "@/components/screens/student-loan-screen"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StudentLoanScreen />
    </Suspense>
  )
}
