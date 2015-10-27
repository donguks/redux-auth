import Cookies from "js-cookie";
import C from "./constants";


// even though this code shouldn't be used server-side, node will throw
// errors if "window" is used
var root = Function("return this")() || (42, eval)("this");

// stateful variables that persist throughout session
root.authState = {
  currentSettings:    {},
  currentEndpoint:    {},
  defaultEndpointKey: null,
  currentEndpointKey: null
}

export function setCurrentSettings (s) {
  root.authState.currentSettings = s;
}

export function getCurrentSettings () {
  return root.authState.currentSettings;
}

export function setCurrentEndpoint (e) {
  root.authState.currentEndpoint = e;
}

export function getCurrentEndpoint () {
  return root.authState.currentEndpoint;
}

export function setDefaultEndpointKey (k) {
  root.authState.defaultEndpointKey = k;
}

export function getDefaultEndpointKey () {
  return root.authState.defaultEndpointKey;
}

// reset stateful variables
export function resetConfig () {
  root.authState = root.authState || {};
  root.authState.currentSettings    = {};
  root.authState.currentEndpoint    = {};
  root.authState.defaultEndpointKey = null;
}

export function destroySession () {
  var sessionKeys = [
    C.SAVED_CREDS_KEY,
    C.SAVED_CONFIG_KEY
  ];

  for (var key in sessionKeys) {
    key = sessionKeys[key];

    // kill all local storage keys
    if (root.localStorage) {
      root.localStorage.removeItem(key);
    }

    // remove from base path in case config is not specified
    Cookies.remove(key, {
      path: root.authState.currentSettings.cookiePath || "/"
    });
  }

  root.authState.currentEndpointKey = null;
}

function unescapeQuotes (val) {
  return val && val.replace(/("|')/g, "");
};


export function getInitialEndpointKey () {
  return unescapeQuotes(
    Cookies.get(C.SAVED_CONFIG_KEY) ||
    (root.localStorage && root.localStorage.getItem(C.SAVED_CONFIG_KEY))
  );
}

// TODO: make this really work
export function getSessionEndpointKey (k) {
  let key = k || root.authState.currentEndpointKey || root.authState.defaultEndpointKey;
  if (!key) {
    throw "You must configure redux-auth before use.";
  } else {
    return key;
  }
}

export function getSessionEndpoint (k) {
  return getCurrentEndpoint()[getSessionEndpointKey(k)];
}

// only should work for current session
export function getDestroyAccountUrl () {
  return `${getApiUrl()}${getSessionEndpoint().accountDeletePath}`
}

// only should work for current session
export function getSignOutUrl () {
  return `${getApiUrl()}${getSessionEndpoint().signOutPath}`
}

export function getEmailSignInUrl (endpointKey) {
  return `${getApiUrl()}${getSessionEndpoint(endpointKey).emailSignInPath}`
}

export function getEmailSignUpUrl (endpointKey) {
  return `${getApiUrl()}${getSessionEndpoint(endpointKey).emailRegistrationPath}`
}

export function getPasswordResetRequestUrl (endpointKey) {
  return `${getApiUrl()}${getSessionEndpoint(endpointKey).passwordResetPath}`
}

export function getPasswordUpdateUrl (endpointKey) {
  return `${getApiUrl()}${getSessionEndpoint(endpointKey).passwordUpdatePath}`
}

export function getTokenValidationPath (endpointKey) {
  return `${getApiUrl()}${getSessionEndpoint(endpointKey).tokenValidationPath}`
}

export function getOAuthUrl ({provider, params, endpointKey}) {
  var oAuthUrl = getApiUrl() + getSessionEndpoint(endpointKey).authProviderPaths[provider] +
    "?auth_origin_url="+encodeURIComponent(root.location.href) +
    "&config_name="+encodeURIComponent(endpointKey || getSessionEndpointKey());

  if (params) {
    for(var key in params) {
      oAuthUrl += "&";
      oAuthUrl += encodeURIComponent(key);
      oAuthUrl += "=";
      oAuthUrl += encodeURIComponent(params[key]);
    }
  }

  return oAuthUrl;
}

export function getConfirmationSuccessUrl () {
  return root.authState.currentSettings.confirmationSuccessUrl();
}

export function getPasswordResetRedirectUrl () {
  return root.authState.currentSettings.confirmationSuccessUrl();
}

export function getApiUrl(key) {
  let configKey = key || root.authState.defaultEndpointKey || root.authState.defaultEndpointKey;
  return root.authState.currentEndpoint[configKey].apiUrl;
}

export function getTokenFormat() {
  return root.authState.currentSettings.tokenFormat;
}

export function persistData (key, val) {
  val = JSON.stringify(val);

  switch (root.authState.currentSettings.storage) {
    case "localStorage":
      root.localStorage.setItem(key, val);
      break;

    default:
      Cookies.set(key, val, {
        expires: root.authState.currentSettings.cookieExpiry,
        path:    root.authState.currentSettings.cookiePath
      });
      break;
  }
};


export function retrieveData (key) {
  var val = null;

  switch (root.authState.currentSettings.storage) {
    case "localStorage":
      val = root.localStorage && root.localStorage.getItem(key);
      break;

    default:
      val = Cookies.get(key);
      break;
  }

  // if value is a simple string, the parser will fail. in that case, simply
  // unescape the quotes and return the string.
  try {
    // return parsed json response
    return JSON.parse(val);
  } catch (err) {
    // unescape quotes
    return unescapeQuotes(val);
  }
};