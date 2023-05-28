import { useAppDispatch, fetchHostPermissions, setHostPermissions, useHostPermission } from "@cryptkeeper/redux";
import { PendingRequest } from "@cryptkeeper/types";
import { getLinkPreview } from "link-preview-js";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

export interface IUseConnectionApprovalModalArgs {
  pendingRequest: PendingRequest<{ origin: string }>;
  accept: () => void;
  reject: () => void;
}

export interface IUseConnectionApprovalModalData {
  host: string;
  checked: boolean;
  faviconUrl: string;
  onAccept: () => void;
  onReject: () => void;
  onSetApproval: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const useConnectionApprovalModal = ({
  pendingRequest,
  accept,
  reject,
}: IUseConnectionApprovalModalArgs): IUseConnectionApprovalModalData => {
  const [faviconUrl, setFaviconUrl] = useState("");
  const { payload } = pendingRequest;
  const host = payload?.origin ?? "";

  const dispatch = useAppDispatch();
  const permission = useHostPermission(host);

  const onAccept = useCallback(() => {
    accept();
  }, [accept]);

  const onReject = useCallback(() => {
    reject();
  }, [reject]);

  const onSetApproval = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      dispatch(setHostPermissions({ host, noApproval: event.target.checked }));
    },
    [host, dispatch],
  );

  useEffect(() => {
    if (!host) {
      return;
    }

    getLinkPreview(host).then((data) => {
      const [favicon] = data.favicons;
      setFaviconUrl(favicon);
    });

    dispatch(fetchHostPermissions(host));
  }, [host, setFaviconUrl]);

  return {
    host,
    checked: Boolean(permission?.noApproval),
    faviconUrl,
    onAccept,
    onReject,
    onSetApproval,
  };
};
