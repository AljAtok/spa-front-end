import { useApi } from "@/hooks/useApi";
import {
  IncentiveTransReportData,
  IncentiveTransReportParams,
} from "@/types/IncentiveTransReportTypes";

export const useIncentiveTransReportApi = () => {
  const { get } = useApi();

  const getIncentiveTransReport = async (
    params: IncentiveTransReportParams = {}
  ) => {
    const queryParams = new URLSearchParams();

    if (params.location_ids) {
      queryParams.append("location_ids", params.location_ids);
    }
    if (params.trans_date) {
      queryParams.append("trans_date", params.trans_date);
    }
    if (params.status_id) {
      queryParams.append("status_id", params.status_id);
    }

    const url = `/reports/incentives${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
    return await get<IncentiveTransReportData[]>(url);
  };

  return {
    getIncentiveTransReport,
  };
};
