namespace EasyStep.Erp.Api.Entities;

public class InventoryItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ExpectedQuantity { get; set; }
    public int ActualQuantity { get; set; }
}
