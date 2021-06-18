#import "RNBraintree.h"
#import "PPDataCollector.h"

@implementation RNBraintree

static NSString *URLScheme;

+ (instancetype)sharedInstance {
    static RNBraintree *_sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _sharedInstance = [[RNBraintree alloc] init];
    });
    return _sharedInstance;
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(setupWithURLScheme:(NSString *)clientToken urlscheme:(NSString*)urlscheme callback:(RCTResponseSenderBlock)callback)
{
    URLScheme = urlscheme;
    [BTAppSwitch setReturnURLScheme:urlscheme];
    self.braintreeClient = [[BTAPIClient alloc] initWithAuthorization:clientToken];
    if (self.braintreeClient == nil) {
        callback(@[@false]);
    }
    else {
        callback(@[@true]);
    }
}

RCT_EXPORT_METHOD(setup:(NSString *)clientToken callback:(RCTResponseSenderBlock)callback)
{
    self.braintreeClient = [[BTAPIClient alloc] initWithAuthorization:clientToken];
    if (self.braintreeClient == nil) {
        callback(@[@false]);
    }
    else {
        callback(@[@true]);
    }
}

RCT_EXPORT_METHOD(showPaymentViewController:(RCTResponseSenderBlock)callback)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        BTDropInViewController *dropInViewController = [[BTDropInViewController alloc] initWithAPIClient:self.braintreeClient];
        dropInViewController.delegate = self;

        dropInViewController.navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemCancel target:self action:@selector(userDidCancelPayment)];

        self.callback = callback;

        UINavigationController *navigationController = [[UINavigationController alloc] initWithRootViewController:dropInViewController];

        self.reactRoot = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
        [self.reactRoot presentViewController:navigationController animated:YES completion:nil];
    });
}

RCT_EXPORT_METHOD(showPayPalViewController:(RCTResponseSenderBlock)callback)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        BTPayPalDriver *payPalDriver = [[BTPayPalDriver alloc] initWithAPIClient:self.braintreeClient];
        payPalDriver.viewControllerPresentingDelegate = self;

        [payPalDriver authorizeAccountWithCompletion:^(BTPayPalAccountNonce *tokenizedPayPalAccount, NSError *error) {
            NSArray *args = @[];
            if ( error == nil ) {
                args = @[[NSNull null], tokenizedPayPalAccount.nonce];
            } else {
                args = @[error.description, [NSNull null]];
            }
            callback(args);
        }];
    });
}

RCT_EXPORT_METHOD(showPayPalPlusEmailViewController:(RCTResponseSenderBlock)callback)
{
    dispatch_async(dispatch_get_main_queue(), ^{
	BTPayPalDriver *payPalDriver = [[BTPayPalDriver alloc] initWithAPIClient:self.braintreeClient];
	payPalDriver.viewControllerPresentingDelegate = self;
	[payPalDriver authorizeAccountWithAdditionalScopes:[NSSet setWithArray:@[@"email"]]
						completion:^(BTPayPalAccountNonce * _Nullable tokenizedPayPalAccount, NSError * _Nullable error) {
	    NSArray *args = @[];
	    if (tokenizedPayPalAccount) {
            args = @[[NSNull null], @{@"status": @"ok",
                                      @"nonce": tokenizedPayPalAccount.nonce,
                                      @"email": tokenizedPayPalAccount.email}];
        } else if (error) {
            args = @[error.localizedDescription, [NSNull null]];
        } else {
            args = @[[NSNull null], @{@"status": @"cancelled"}];
	    }
	    callback(args);
	  }];
    });
}

RCT_EXPORT_METHOD(showPayPalPlusAttributesViewController:(RCTResponseSenderBlock)callback)
{
    dispatch_async(dispatch_get_main_queue(), ^{
	BTPayPalDriver *payPalDriver = [[BTPayPalDriver alloc] initWithAPIClient:self.braintreeClient];
	payPalDriver.viewControllerPresentingDelegate = self;
	[payPalDriver authorizeAccountWithAdditionalScopes:[NSSet setWithArray:@[@"email", @"address"]]
						completion:^(BTPayPalAccountNonce * _Nullable tokenizedPayPalAccount, NSError * _Nullable   error) {
	    NSArray *args = @[];
	    if (tokenizedPayPalAccount) {
            BTPostalAddress *address = tokenizedPayPalAccount.shippingAddress ?: tokenizedPayPalAccount.billingAddress;
            NSMutableDictionary *dicAddress = [NSMutableDictionary
						  dictionaryWithDictionary: @{}];
            if (address.streetAddress) {
                [dicAddress setObject:address.streetAddress forKey:@"street-address"];
            }
            if (address.locality) {
                [dicAddress setObject:address.locality forKey:@"locality"];
            }
            if (address.countryCodeAlpha2) {
                [dicAddress setObject:address.countryCodeAlpha2 forKey:@"country-code-alpha-2"];
            }
            if (address.recipientName) {
                [dicAddress setObject:address.recipientName forKey:@"recipient-name"];
            }
            if (address.extendedAddress) {
                [dicAddress setObject:address.extendedAddress forKey:@"extended-address"];
            }
            if (address.postalCode) {
                [dicAddress setObject:address.postalCode forKey:@"postal-code"];
            }
            if (address.region) {
                [dicAddress setObject:address.region forKey:@"region"];
            }
            args = @[[NSNull null], @{@"status": @"ok",
                                      @"nonce": tokenizedPayPalAccount.nonce,
                                      @"email": tokenizedPayPalAccount.email,
                                      @"address": dicAddress}];
        } else if (error) {
            args = @[error.localizedDescription, [NSNull null]];
        } else {
            args = @[[NSNull null], @{@"status": @"cancelled"}];
	    }
	    callback(args);
	  }];
    });
}

RCT_EXPORT_METHOD(showBillingAgreementViewController:(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_main_queue(), ^{
      BTPayPalDriver *payPalDriver = [[BTPayPalDriver alloc] initWithAPIClient:self.braintreeClient];
      payPalDriver.viewControllerPresentingDelegate = self;
      BTPayPalRequest *checkout = [[BTPayPalRequest alloc] init];
      checkout.billingAgreementDescription = @"Your agreement description";
      [payPalDriver authorizeAccountWithCompletion:^(BTPayPalAccountNonce *tokenizedPayPalAccount, NSError *error) {
	  NSArray *args = @[];
	  if ( error == nil ) {
	    args = @[[NSNull null], tokenizedPayPalAccount.nonce];
	  } else {
	    args = @[error.description, [NSNull null]];
	  }
	  callback(args);
	}];
    });
}

RCT_EXPORT_METHOD(getPayPalClientMetadataId:(RCTResponseSenderBlock)callback)
{
    callback(@[[NSNull null], [PPDataCollector clientMetadataID]]);
}

RCT_EXPORT_METHOD(getCardNonce: (NSString *)cardNumber
                  expirationMonth: (NSString *)expirationMonth
                  expirationYear: (NSString *)expirationYear
                  callback: (RCTResponseSenderBlock)callback
                  )
{
    BTCardClient *cardClient = [[BTCardClient alloc] initWithAPIClient: self.braintreeClient];
    BTCard *card = [[BTCard alloc] initWithNumber:cardNumber expirationMonth:expirationMonth expirationYear:expirationYear cvv:nil];

    [cardClient tokenizeCard:card
                  completion:^(BTCardNonce *tokenizedCard, NSError *error) {

                      NSArray *args = @[];
                      if ( error == nil ) {
                          args = @[[NSNull null], tokenizedCard.nonce];
                      } else {
                          args = @[error.description, [NSNull null]];
                      }
                      callback(args);
                  }
     ];
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {
    if ([url.scheme localizedCaseInsensitiveCompare:URLScheme] == NSOrderedSame) {
        return [BTAppSwitch handleOpenURL:url sourceApplication:sourceApplication];
    }
    return NO;
}

#pragma mark - BTViewControllerPresentingDelegate

- (void)paymentDriver:(id)paymentDriver requestsPresentationOfViewController:(UIViewController *)viewController {
    self.reactRoot = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
    [self.reactRoot presentViewController:viewController animated:YES completion:nil];
}

- (void)paymentDriver:(id)paymentDriver requestsDismissalOfViewController:(UIViewController *)viewController {
    self.reactRoot = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
    [self.reactRoot dismissViewControllerAnimated:YES completion:nil];
}

#pragma mark - BTDropInViewControllerDelegate

- (void)userDidCancelPayment {
    [self.reactRoot dismissViewControllerAnimated:YES completion:nil];
    self.callback(@[@"User cancelled payment", [NSNull null]]);
}

- (void)dropInViewController:(BTDropInViewController *)viewController didSucceedWithTokenization:(BTPaymentMethodNonce *)paymentMethodNonce {
    self.callback(@[[NSNull null],paymentMethodNonce.nonce]);
    [viewController dismissViewControllerAnimated:YES completion:nil];
}

- (void)dropInViewControllerDidCancel:(__unused BTDropInViewController *)viewController {
    [viewController dismissViewControllerAnimated:YES completion:nil];
    self.callback(@[@"Drop-In ViewController Closed", [NSNull null]]);
}

@end
