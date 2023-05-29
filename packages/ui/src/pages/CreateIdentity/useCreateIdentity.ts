import { getEnabledFeatures } from "@cryptkeeper/config";
import { WEB2_PROVIDER_OPTIONS, IDENTITY_TYPES, Paths } from "@cryptkeeper/constants";
import { closePopup, useAppDispatch, createIdentity } from "@cryptkeeper/redux";
import { IdentityStrategy, IdentityWeb2Provider, SelectOption } from "@cryptkeeper/types";
import { BaseSyntheticEvent, useCallback } from "react";
import { Control, useForm, UseFormRegister } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useWallet } from "../../hooks/wallet";
import { signIdentityMessage } from "../../services/identity";

export interface IUseCreateIdentityData {
  isLoading: boolean;
  isProviderAvailable: boolean;
  errors: Partial<{
    root: string;
    identityStrategyType: string;
    web2Provider: string;
    nonce: string;
  }>;
  control: Control<FormFields, unknown>;
  closeModal: () => void;
  register: UseFormRegister<FormFields>;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
}

interface FormFields {
  identityStrategyType: SelectOption;
  web2Provider: SelectOption;
  nonce: number;
}

export const useCreateIdentity = (): IUseCreateIdentityData => {
  const features = getEnabledFeatures();
  const {
    formState: { isSubmitting, isLoading, errors },
    control,
    setError,
    watch,
    register,
    handleSubmit,
  } = useForm({
    defaultValues: {
      identityStrategyType: IDENTITY_TYPES[0],
      web2Provider: WEB2_PROVIDER_OPTIONS[0],
      nonce: 0,
    },
  });
  const navigate = useNavigate();

  const { address, provider } = useWallet();
  const dispatch = useAppDispatch();
  const values = watch();

  const onCreateIdentity = useCallback(
    async (data: FormFields) => {
      const { identityStrategyType, web2Provider, nonce } = data;

      try {
        const options =
          identityStrategyType.value !== "random"
            ? { nonce, web2Provider: web2Provider.value as IdentityWeb2Provider, account: address }
            : {};
        const signer = await provider?.getSigner();

        const messageSignature = await signIdentityMessage({
          web2Provider: web2Provider.value as IdentityWeb2Provider,
          nonce,
          signer,
          identityStrategyType: identityStrategyType.value as IdentityStrategy,
        });

        if (messageSignature) {
          await dispatch(createIdentity(identityStrategyType.value as IdentityStrategy, messageSignature, options));
          navigate(Paths.HOME);
        }
      } catch (err) {
        setError("root", { type: "submit", message: (err as Error).message });
      }
    },
    [address, provider, dispatch, setError],
  );

  const closeModal = useCallback(() => {
    dispatch(closePopup());
  }, [dispatch]);

  return {
    isLoading: isLoading || isSubmitting,
    isProviderAvailable: values.identityStrategyType.value === "interrep" || !features.RANDOM_IDENTITY,
    errors: {
      web2Provider: errors.web2Provider?.message,
      identityStrategyType: errors.identityStrategyType?.message,
      nonce: errors.nonce?.message,
      root: errors.root?.message,
    },
    control,
    closeModal,
    register,
    onSubmit: handleSubmit(onCreateIdentity),
  };
};
