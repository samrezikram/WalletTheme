package com.simplewallet.BrainTreeWrapper;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.util.Log;
import android.widget.Toast;

import com.braintreepayments.api.dropin.DropInActivity;
import com.braintreepayments.api.dropin.DropInRequest;
import com.braintreepayments.api.dropin.DropInResult;

import com.braintreepayments.api.models.BraintreeApiConfiguration;
import com.braintreepayments.api.models.PaymentMethodNonce;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;
import java.util.Map;

public class RNBraintree extends ReactContextBaseJavaModule {

    private static final String DURATION_SHORT_KEY = "SHORT";
    private static final String DURATION_LONG_KEY = "LONG";

    private static final int DROP_IN_REQUEST = 100;

    private String braintreeTokenizationKey;


    public com.facebook.react.bridge.Promise nonce_promise;
    @Override
    public String getName() {
        return "RNBraintree";
    }

    ReactApplicationContext ctx;

    // Module Initialization ------------------------------------------------------------------------------------------------
    public RNBraintree(ReactApplicationContext reactContext) {
        super(reactContext);
        ctx = reactContext;
        try {
            reactContext.addActivityEventListener(mActivityEventListener);
            Log.v("BrainTreeModule_init", "SUCCEED");
        } catch (Exception e) {
            e.printStackTrace();
            Log.v("BrainTreeModule_Res", "FAILED");
        }
    }
    //------------------------------------


    @ReactMethod
    protected  void setup(final String clientToken, final Promise promise) {
        nonce_promise = promise;
        if(clientToken.isEmpty()){
            promise.reject("15", "Something went wrong ");
        } else {
            this.braintreeTokenizationKey = clientToken;
            promise.resolve(true);
        }
    }

    @ReactMethod
    protected  void showPaymentViewController(final Promise promise) {
        nonce_promise = promise;
        Activity currentActivity = getReactApplicationContext().getCurrentActivity();

        if (currentActivity == null) {
            promise.reject("Activity Does not exist", "Activity doesn't exist");
            return;
        }

        try {
            DropInRequest dropInRequest = new DropInRequest()
                    .clientToken(this.braintreeTokenizationKey);
            getReactApplicationContext().getCurrentActivity().startActivityForResult(dropInRequest.getIntent(getReactApplicationContext().getCurrentActivity()), DROP_IN_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            nonce_promise.reject("15", "Something went wrong, " + e.getMessage());
        }
    }
    //------------------------------------

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put(DURATION_SHORT_KEY, Toast.LENGTH_SHORT);
        constants.put(DURATION_LONG_KEY, Toast.LENGTH_LONG);
        return constants;
    }
    //------------------------------------

    /**
     *
     * @param activity
     * @param requestCode
     * @param resultCode
     * @param data
     */
    private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {

        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
            if (requestCode == DROP_IN_REQUEST) {
                if (resultCode == Activity.RESULT_OK) {
                    DropInResult result = intent.getParcelableExtra(DropInResult.EXTRA_DROP_IN_RESULT);
                    PaymentMethodNonce nonce = result.getPaymentMethodNonce();
                    if (nonce_promise != null) {
                        nonce_promise.resolve(nonce.getNonce() + "");
                    } else {
                        nonce_promise.reject("11", "Empty nonce");

                    }
                } else {
                    nonce_promise.reject("15", "Something went wrong, resultCode: " + resultCode);
                }
            }
        }
    };


}
