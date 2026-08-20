import { memo, useState } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';

import type { GlobalState } from '../../global/types';

import { IS_TOUCH_ENV } from '../../util/browser/windowEnvironment';
import { pick } from '../../util/iteratees';

import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';

import Button from '../ui/Button';
import InputText from '../ui/InputText';

type StateProps = {
  auth: GlobalState['auth'];
};

const AuthBotToken = ({
  auth,
}: StateProps) => {
  const { loginWithBotToken, goToAuthQrCode, returnToAuthPhoneNumber } = getActions();
  const { isLoading, errorKey } = auth;

  const lang = useLang();
  const [token, setToken] = useState('');
  const [isTokenVisible, setIsTokenVisible] = useState(!IS_TOUCH_ENV);

  const canSubmit = token.trim().length > 0;

  const handleSubmit = useLastCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || isLoading) return;

    loginWithBotToken({ token: token.trim() });
  });

  const handleTokenChange = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  });

  const handleBackToPhone = useLastCallback(() => {
    returnToAuthPhoneNumber();
  });

  const handleBackToQr = useLastCallback(() => {
    goToAuthQrCode();
  });

  return (
    <div id="auth-bot-token-form" className="custom-scroll">
      <div className="auth-form">
        <div id="logo" />
        <h1>{lang('LoginBotTokenTitle')}</h1>
        <p className="note">{lang('LoginBotTokenDescription')}</p>
        <form className="form" action="" onSubmit={handleSubmit}>
          <InputText
            id="sign-in-bot-token"
            label={lang('LoginBotTokenPlaceholder')}
            value={token}
            error={errorKey && lang.withRegular(errorKey)}
            type={isTokenVisible ? 'text' : 'password'}
            onChange={handleTokenChange}
          />
          <Button
            className="auth-button"
            type="submit"
            ripple
            disabled={!canSubmit}
            isLoading={isLoading}
          >
            {lang('LoginBotTokenSubmit')}
          </Button>
          <Button
            className="auth-button"
            isText
            ripple
            onClick={() => setIsTokenVisible(!isTokenVisible)}
          >
            {lang(isTokenVisible ? 'LoginBotTokenHide' : 'LoginBotTokenShow')}
          </Button>
          <Button className="auth-button" isText ripple onClick={handleBackToPhone}>
            {lang('LoginBotTokenBackToPhone')}
          </Button>
          <Button className="auth-button" isText ripple onClick={handleBackToQr}>
            {lang('LoginQRLogin')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default memo(withGlobal(
  (global): Complete<StateProps> => (
    pick(global, ['auth'])
  ),
)(AuthBotToken));
