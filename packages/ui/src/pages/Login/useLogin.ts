import { Paths } from "@cryptkeeper/constants";
import { unlock, useAppDispatch } from "@cryptkeeper/redux";
import { PasswordFormFields } from "@cryptkeeper/types";
import { BaseSyntheticEvent, useCallback, useState } from "react";
import { UseFormRegister, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export interface IUseLoginData {
  isLoading: boolean;
  errors: Partial<LoginFields>;
  register: UseFormRegister<LoginFields>;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  isShowPassword: boolean;
  onShowPassword: () => void;
}

type LoginFields = Pick<PasswordFormFields, "password">;

export const useLogin = (): IUseLoginData => {
  const [isShowPassword, setIsShowPassword] = useState(false);

  const {
    formState: { isLoading, isSubmitting, errors },
    setError,
    register,
    handleSubmit,
  } = useForm<LoginFields>({
    defaultValues: {
      password: "",
    },
  });

  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const onSubmit = useCallback(
    (data: LoginFields) => {
      dispatch(unlock(data.password))
        .then(() => navigate(Paths.HOME))
        .catch((error: Error) => setError("password", { type: "submit", message: error.message }));
    },
    [dispatch, navigate, setError],
  );

  const onShowPassword = useCallback(() => {
    setIsShowPassword((isShow) => !isShow);
  }, [setIsShowPassword]);

  return {
    isLoading: isLoading || isSubmitting,
    errors: {
      password: errors.password?.message,
    },
    register,
    onSubmit: handleSubmit(onSubmit),
    isShowPassword,
    onShowPassword,
  };
};
