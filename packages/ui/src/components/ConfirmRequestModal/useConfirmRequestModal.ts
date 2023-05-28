import { useAppDispatch, finalizeRequest, usePendingRequests } from "@cryptkeeper/redux";
import { PendingRequest, RequestResolutionAction, RequestResolutionStatus } from "@cryptkeeper/types";
import { useCallback, useState } from "react";

export interface IUseConfirmRequestModalData {
  error: string;
  loading: boolean;
  pendingRequests: PendingRequest[];
  accept: (data?: unknown) => void;
  reject: (err?: Error) => void;
}

export const useConfirmRequestModal = (): IUseConfirmRequestModalData => {
  const pendingRequests = usePendingRequests();
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRequest] = pendingRequests;

  const reject = useCallback(
    (err?: Error) => {
      const req: RequestResolutionAction<Error> = {
        id: pendingRequest?.id,
        status: RequestResolutionStatus.REJECT,
        data: err,
      };

      setLoading(true);
      dispatch(finalizeRequest(req))
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    },
    [pendingRequest?.id, setLoading, setError, dispatch],
  );

  const accept = useCallback(
    (data?: unknown) => {
      const req: RequestResolutionAction = {
        id: pendingRequest?.id,
        status: RequestResolutionStatus.ACCEPT,
        data,
      };

      setLoading(true);
      dispatch(finalizeRequest(req))
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    },
    [pendingRequest?.id, setError, setLoading],
  );

  return {
    loading,
    error,
    pendingRequests,
    accept,
    reject,
  };
};
