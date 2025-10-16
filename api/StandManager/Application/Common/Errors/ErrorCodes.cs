namespace StandManager.Application.Common.Errors;

public static class ErrorCodes
{
    public const string CustomerNameRequired = "errors.order.customer_name_required";
    public const string CustomerSessionNotFound = "errors.order.customer_session_not_found";
    public const string FlavorNameExists = "errors.flavor.name_exists";
    public const string FlavorNotFound = "errors.flavor.not_found";
    public const string FlavorOutOfStock = "errors.flavor.out_of_stock";
    public const string InvalidStatusTransition = "errors.order.invalid_status_transition";
    public const string OrderItemAlreadyAtFinalStage = "errors.order.item_already_final";
    public const string OrderItemAlreadyCompleted = "errors.order.item_completed";
    public const string OrderItemNotFound = "errors.order.item_not_found";
    public const string OrderMustHaveItems = "errors.order.must_have_items";
    public const string OrderNotFound = "errors.order.not_found";
    public const string OrderCannotBeCancelled = "errors.order.cannot_cancel";
}
